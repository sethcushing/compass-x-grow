"""
Test Suite for CompassX CRM User Management Features
- Health endpoint
- Admin login with seth.cushing@compassx.com / CompassX2026!
- User CRUD operations (create, read, update, delete users)
- Password reset functionality
- Admin-only access controls
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_EMAIL = "seth.cushing@compassx.com"
ADMIN_PASSWORD = "CompassX2026!"

class TestHealthEndpoint:
    """Test health check endpoint"""
    
    def test_health_returns_healthy(self):
        """Health endpoint should return healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "connected"
        print("PASS: Health endpoint returns healthy status")


class TestAdminLogin:
    """Test admin login functionality"""
    
    def test_admin_login_success(self):
        """Admin can login with seth.cushing@compassx.com and CompassX2026!"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert data["email"] == ADMIN_EMAIL.lower()
        assert data["role"] == "admin"
        assert data["name"] == "Seth Cushing"
        print(f"PASS: Admin login successful for {ADMIN_EMAIL}")
        return response.cookies
    
    def test_admin_login_wrong_password(self):
        """Admin login with wrong password should fail"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": "WrongPassword123!"}
        )
        assert response.status_code == 401
        print("PASS: Login correctly rejected with wrong password")
    
    def test_login_nonexistent_user(self):
        """Login with non-existent user should fail"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "nonexistent@compassx.com", "password": "AnyPassword123!"}
        )
        assert response.status_code == 401
        print("PASS: Login correctly rejected for non-existent user")


class TestUserManagement:
    """Test user management CRUD operations - Admin only"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin and get session"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200, "Admin login failed"
        self.admin_user = login_response.json()
        
    def test_get_all_users(self):
        """Admin can get list of all users"""
        response = self.session.get(f"{BASE_URL}/api/auth/users")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Admin user should be in the list
        admin_found = any(u["email"] == ADMIN_EMAIL.lower() for u in data)
        assert admin_found, "Admin user not found in user list"
        print(f"PASS: Get all users returns {len(data)} users")
    
    def test_create_user_success(self):
        """Admin can create a new user"""
        unique_id = uuid.uuid4().hex[:8]
        new_user_data = {
            "name": f"TEST_User_{unique_id}",
            "email": f"test_{unique_id}@compassx.com",
            "password": "TestPassword123!",
            "role": "sales_lead"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/auth/users",
            json=new_user_data
        )
        assert response.status_code == 200 or response.status_code == 201, f"Create user failed: {response.text}"
        created_user = response.json()
        assert created_user["email"] == new_user_data["email"].lower()
        assert created_user["name"] == new_user_data["name"]
        assert created_user["role"] == new_user_data["role"]
        assert "user_id" in created_user
        print(f"PASS: Created user {created_user['email']}")
        
        # Cleanup: delete the test user
        self.session.delete(f"{BASE_URL}/api/auth/users/{created_user['user_id']}")
        return created_user
    
    def test_create_user_duplicate_email(self):
        """Cannot create user with existing email"""
        response = self.session.post(
            f"{BASE_URL}/api/auth/users",
            json={
                "name": "Duplicate Admin",
                "email": ADMIN_EMAIL,
                "password": "SomePassword123!",
                "role": "sales_lead"
            }
        )
        assert response.status_code == 400
        print("PASS: Duplicate email correctly rejected")
    
    def test_create_user_short_password(self):
        """Cannot create user with password less than 8 characters"""
        response = self.session.post(
            f"{BASE_URL}/api/auth/users",
            json={
                "name": "Short Password User",
                "email": "shortpass@compassx.com",
                "password": "short",
                "role": "sales_lead"
            }
        )
        assert response.status_code == 400
        print("PASS: Short password correctly rejected")
    
    def test_create_user_invalid_role(self):
        """Cannot create user with invalid role"""
        response = self.session.post(
            f"{BASE_URL}/api/auth/users",
            json={
                "name": "Invalid Role User",
                "email": "invalidrole@compassx.com",
                "password": "ValidPassword123!",
                "role": "invalid_role"
            }
        )
        assert response.status_code == 400
        print("PASS: Invalid role correctly rejected")
    
    def test_update_user_success(self):
        """Admin can update an existing user"""
        # First create a user to update
        unique_id = uuid.uuid4().hex[:8]
        create_response = self.session.post(
            f"{BASE_URL}/api/auth/users",
            json={
                "name": f"TEST_Update_{unique_id}",
                "email": f"test_update_{unique_id}@compassx.com",
                "password": "TestPassword123!",
                "role": "sales_lead"
            }
        )
        created_user = create_response.json()
        user_id = created_user["user_id"]
        
        # Update the user
        update_data = {
            "name": f"TEST_Updated_{unique_id}",
            "email": f"test_updated_{unique_id}@compassx.com",
            "role": "admin"
        }
        update_response = self.session.put(
            f"{BASE_URL}/api/auth/users/{user_id}",
            json=update_data
        )
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        updated_user = update_response.json()
        assert updated_user["name"] == update_data["name"]
        assert updated_user["email"] == update_data["email"].lower()
        assert updated_user["role"] == update_data["role"]
        print(f"PASS: User updated successfully")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/auth/users/{user_id}")
    
    def test_reset_user_password(self):
        """Admin can reset another user's password"""
        # First create a user
        unique_id = uuid.uuid4().hex[:8]
        create_response = self.session.post(
            f"{BASE_URL}/api/auth/users",
            json={
                "name": f"TEST_Reset_{unique_id}",
                "email": f"test_reset_{unique_id}@compassx.com",
                "password": "OldPassword123!",
                "role": "sales_lead"
            }
        )
        created_user = create_response.json()
        user_id = created_user["user_id"]
        user_email = created_user["email"]
        
        # Reset the password
        new_password = "NewPassword456!"
        reset_response = self.session.post(
            f"{BASE_URL}/api/auth/users/{user_id}/reset-password",
            json={"new_password": new_password}
        )
        assert reset_response.status_code == 200, f"Reset password failed: {reset_response.text}"
        
        # Verify user can login with new password
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": user_email, "password": new_password}
        )
        assert login_response.status_code == 200, "Login with new password failed"
        print(f"PASS: Password reset successful")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/auth/users/{user_id}")
    
    def test_delete_user_success(self):
        """Admin can delete a user"""
        # First create a user to delete
        unique_id = uuid.uuid4().hex[:8]
        create_response = self.session.post(
            f"{BASE_URL}/api/auth/users",
            json={
                "name": f"TEST_Delete_{unique_id}",
                "email": f"test_delete_{unique_id}@compassx.com",
                "password": "TestPassword123!",
                "role": "sales_lead"
            }
        )
        created_user = create_response.json()
        user_id = created_user["user_id"]
        
        # Delete the user
        delete_response = self.session.delete(f"{BASE_URL}/api/auth/users/{user_id}")
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        
        # Verify user cannot login anymore
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": created_user["email"], "password": "TestPassword123!"}
        )
        assert login_response.status_code == 401, "Deleted user should not be able to login"
        print(f"PASS: User deleted successfully")
    
    def test_admin_cannot_delete_self(self):
        """Admin cannot delete their own account"""
        delete_response = self.session.delete(
            f"{BASE_URL}/api/auth/users/{self.admin_user['user_id']}"
        )
        assert delete_response.status_code == 400
        print("PASS: Admin correctly prevented from self-deletion")


class TestNonAdminAccess:
    """Test that non-admin users cannot access user management"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create a non-admin user and login"""
        # Login as admin first to create test user
        admin_session = requests.Session()
        admin_session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        
        # Create a non-admin test user
        self.unique_id = uuid.uuid4().hex[:8]
        self.test_user_password = "TestUser123!"
        create_response = admin_session.post(
            f"{BASE_URL}/api/auth/users",
            json={
                "name": f"TEST_NonAdmin_{self.unique_id}",
                "email": f"test_nonadmin_{self.unique_id}@compassx.com",
                "password": self.test_user_password,
                "role": "sales_lead"
            }
        )
        self.test_user = create_response.json()
        self.admin_session = admin_session
        
        # Login as the non-admin user
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": self.test_user["email"], "password": self.test_user_password}
        )
        assert login_response.status_code == 200
        
    def teardown_method(self):
        """Cleanup test user"""
        if hasattr(self, 'admin_session') and hasattr(self, 'test_user'):
            self.admin_session.delete(f"{BASE_URL}/api/auth/users/{self.test_user['user_id']}")
    
    def test_nonadmin_cannot_create_user(self):
        """Non-admin user cannot create new users"""
        response = self.session.post(
            f"{BASE_URL}/api/auth/users",
            json={
                "name": "Unauthorized Create",
                "email": "unauthorized@compassx.com",
                "password": "Password123!",
                "role": "sales_lead"
            }
        )
        assert response.status_code == 403
        print("PASS: Non-admin correctly blocked from creating users")
    
    def test_nonadmin_cannot_update_user(self):
        """Non-admin user cannot update other users"""
        response = self.session.put(
            f"{BASE_URL}/api/auth/users/{self.test_user['user_id']}",
            json={"name": "Unauthorized Update"}
        )
        assert response.status_code == 403
        print("PASS: Non-admin correctly blocked from updating users")
    
    def test_nonadmin_cannot_delete_user(self):
        """Non-admin user cannot delete users"""
        response = self.session.delete(
            f"{BASE_URL}/api/auth/users/{self.test_user['user_id']}"
        )
        assert response.status_code == 403
        print("PASS: Non-admin correctly blocked from deleting users")
    
    def test_nonadmin_cannot_reset_password(self):
        """Non-admin user cannot reset other users' passwords"""
        response = self.session.post(
            f"{BASE_URL}/api/auth/users/{self.test_user['user_id']}/reset-password",
            json={"new_password": "HackedPassword123!"}
        )
        assert response.status_code == 403
        print("PASS: Non-admin correctly blocked from resetting passwords")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
