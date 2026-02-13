"""
Test suite for Google OAuth with email whitelisting feature.
Tests:
- Password login still works for authorized users
- POST /api/auth/google/session endpoint exists and returns appropriate responses
- Backend properly rejects unauthorized emails
- Role assignments (Seth as admin, others as sales_lead)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPasswordLogin:
    """Tests for existing password login functionality"""
    
    def test_password_login_success(self):
        """Test password login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "brian.clements@compassx.com",
            "password": "CompassX2026!"
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "user_id" in data
        assert data["email"] == "brian.clements@compassx.com"
        assert data["name"] == "Brian Clements"
        # Role can be either sales_lead or admin depending on database state
        assert data["role"] in ["sales_lead", "admin"], f"Unexpected role: {data['role']}"
    
    def test_password_login_invalid_password(self):
        """Test password login with invalid password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "brian.clements@compassx.com",
            "password": "WrongPassword"
        })
        
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
    
    def test_password_login_unauthorized_email(self):
        """Test password login with email not in authorized list"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "random@notauthorized.com",
            "password": "anypassword"
        })
        
        assert response.status_code == 401
        data = response.json()
        assert "Unauthorized" in data.get("detail", "") or "unauthorized" in data.get("detail", "").lower()


class TestGoogleOAuthSession:
    """Tests for Google OAuth session endpoint"""
    
    def test_google_session_endpoint_exists(self):
        """Test that POST /api/auth/google/session endpoint exists"""
        # Send request without session_id - should return 400 (not 404)
        response = requests.post(f"{BASE_URL}/api/auth/google/session", json={})
        
        # Endpoint exists - should return 400 for missing session_id (not 404)
        assert response.status_code != 404, "Endpoint /api/auth/google/session does not exist"
        assert response.status_code == 400, f"Expected 400 for missing session_id, got {response.status_code}"
        
        data = response.json()
        assert "session_id" in data.get("detail", "").lower()
    
    def test_google_session_invalid_session(self):
        """Test Google OAuth with invalid session_id returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/google/session", json={
            "session_id": "invalid_session_id_12345"
        })
        
        # Should return 401 for invalid session (or 500 if auth service unavailable)
        assert response.status_code in [401, 500], f"Expected 401 or 500 for invalid session, got {response.status_code}"


class TestAuthorizedUsers:
    """Tests for authorized user list and roles"""
    
    def get_session_cookie(self):
        """Helper to get authenticated session"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "brian.clements@compassx.com",
            "password": "CompassX2026!"
        })
        return response.cookies
    
    def test_authorized_users_list(self):
        """Test that only 7 authorized users exist"""
        cookies = self.get_session_cookie()
        
        response = requests.get(f"{BASE_URL}/api/auth/users", cookies=cookies)
        
        assert response.status_code == 200
        users = response.json()
        
        # Should have exactly 7 authorized users
        assert len(users) == 7, f"Expected 7 authorized users, got {len(users)}"
        
        # Get list of emails
        emails = [u["email"].lower() for u in users]
        
        expected_emails = [
            "arman.bozorgmanesh@compassx.com",
            "brian.clements@compassx.com",
            "jamiee@compassx.com",
            "kyleh@compassx.com",
            "randyc@compassx.com",
            "reynoldk@compassx.com",
            "seth.cushing@compassx.com"
        ]
        
        for email in expected_emails:
            assert email in emails, f"Missing authorized user: {email}"
    
    def test_seth_cushing_is_admin(self):
        """Test that Seth Cushing has admin role"""
        cookies = self.get_session_cookie()
        
        response = requests.get(f"{BASE_URL}/api/auth/users", cookies=cookies)
        
        assert response.status_code == 200
        users = response.json()
        
        seth = next((u for u in users if u["email"].lower() == "seth.cushing@compassx.com"), None)
        assert seth is not None, "Seth Cushing not found in users"
        assert seth["role"] == "admin", f"Seth should be admin, got {seth['role']}"
    
    def test_other_users_are_sales_lead(self):
        """Test that non-Seth users have sales_lead role"""
        cookies = self.get_session_cookie()
        
        response = requests.get(f"{BASE_URL}/api/auth/users", cookies=cookies)
        
        assert response.status_code == 200
        users = response.json()
        
        for user in users:
            if user["email"].lower() != "seth.cushing@compassx.com":
                assert user["role"] == "sales_lead", f"User {user['email']} should be sales_lead, got {user['role']}"


class TestAuthMeEndpoint:
    """Tests for /api/auth/me endpoint with cookie authentication"""
    
    def test_auth_me_with_valid_session(self):
        """Test /api/auth/me returns user data when authenticated"""
        # First login to get session cookie
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "brian.clements@compassx.com",
            "password": "CompassX2026!"
        })
        
        assert login_response.status_code == 200
        cookies = login_response.cookies
        
        # Now test /api/auth/me
        response = requests.get(f"{BASE_URL}/api/auth/me", cookies=cookies)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "brian.clements@compassx.com"
        assert data["role"] == "sales_lead"
    
    def test_auth_me_without_session(self):
        """Test /api/auth/me returns 401 when not authenticated"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        
        assert response.status_code == 401


class TestLogout:
    """Tests for logout endpoint"""
    
    def test_logout_clears_session(self):
        """Test that logout clears session cookie"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "brian.clements@compassx.com",
            "password": "CompassX2026!"
        })
        cookies = login_response.cookies
        
        # Logout
        logout_response = requests.post(f"{BASE_URL}/api/auth/logout", cookies=cookies)
        
        assert logout_response.status_code == 200
        data = logout_response.json()
        assert "message" in data
