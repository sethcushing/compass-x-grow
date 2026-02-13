"""
CompassX CRM Feature Tests
- Owner selection for Organizations/Contacts/Opportunities
- AI Copilot functionality
- Analytics/Reports APIs
- My Pipeline vs Main Pipeline filtering
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')
if not BASE_URL:
    BASE_URL = "https://activity-hub-63.preview.emergentagent.com"

print(f"Testing BASE_URL: {BASE_URL}")

class TestAuthAndUserSetup:
    """Authentication and user setup tests"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create a session with cookies for authentication"""
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def auth_token(self, session):
        """Login and get authentication"""
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "brian.clements@compassx.com",
                "password": "CompassX2026!"
            }
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        user_data = response.json()
        assert "user_id" in user_data
        assert user_data["email"] == "brian.clements@compassx.com"
        return session, user_data

    def test_login_success(self, session):
        """Test login with valid credentials"""
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "brian.clements@compassx.com",
                "password": "CompassX2026!"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "brian.clements@compassx.com"
        assert data["name"] == "Brian Clements"
        print(f"✓ Login successful for {data['name']}")
    
    def test_get_all_users(self, auth_token):
        """Test getting all users list"""
        session, _ = auth_token
        response = session.get(f"{BASE_URL}/api/auth/users")
        assert response.status_code == 200
        users = response.json()
        assert len(users) >= 1, "Should have at least 1 user"
        
        # Check user structure
        for user in users:
            assert "user_id" in user
            assert "email" in user
            assert "name" in user
        print(f"✓ Retrieved {len(users)} users")
        return users


class TestOrganizationOwnerSelection:
    """Test organization creation with owner selection"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def auth_session(self, session):
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "brian.clements@compassx.com",
                "password": "CompassX2026!"
            }
        )
        assert response.status_code == 200
        return session, response.json()
    
    def test_get_users_for_owner_dropdown(self, auth_session):
        """Verify users API returns list for owner dropdown"""
        session, _ = auth_session
        response = session.get(f"{BASE_URL}/api/auth/users")
        assert response.status_code == 200
        users = response.json()
        assert len(users) >= 1
        print(f"✓ Users available for owner dropdown: {[u['name'] for u in users]}")
        return users
    
    def test_create_organization_with_owner(self, auth_session):
        """Test creating organization with specific owner"""
        session, current_user = auth_session
        
        # Get users first
        users_response = session.get(f"{BASE_URL}/api/auth/users")
        users = users_response.json()
        
        # Pick a different owner if available
        owner = users[0] if users else current_user
        
        org_data = {
            "name": f"TEST_Org_Owner_{int(time.time())}",
            "industry": "Technology",
            "company_size": "Enterprise",
            "region": "North America",
            "strategic_tier": "Strategic",
            "owner_id": owner["user_id"]
        }
        
        response = session.post(
            f"{BASE_URL}/api/organizations",
            json=org_data
        )
        assert response.status_code == 200
        created_org = response.json()
        
        # Verify owner_id was set correctly
        assert created_org["owner_id"] == owner["user_id"], \
            f"Owner not set correctly. Expected {owner['user_id']}, got {created_org['owner_id']}"
        print(f"✓ Organization created with owner: {owner['name']}")
        
        # Cleanup
        session.delete(f"{BASE_URL}/api/organizations/{created_org['org_id']}")
        return created_org


class TestContactOwnerSelection:
    """Test contact creation with owner selection"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def auth_session(self, session):
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "brian.clements@compassx.com",
                "password": "CompassX2026!"
            }
        )
        assert response.status_code == 200
        return session, response.json()
    
    def test_create_contact_with_owner(self, auth_session):
        """Test creating contact with specific owner"""
        session, current_user = auth_session
        
        # Get users first
        users_response = session.get(f"{BASE_URL}/api/auth/users")
        users = users_response.json()
        owner = users[0] if users else current_user
        
        # Get an organization for the contact
        orgs_response = session.get(f"{BASE_URL}/api/organizations")
        orgs = orgs_response.json()
        assert len(orgs) > 0, "Need at least one organization"
        
        contact_data = {
            "name": f"TEST_Contact_{int(time.time())}",
            "title": "Chief Test Officer",
            "function": "IT",
            "email": "test@example.com",
            "org_id": orgs[0]["org_id"],
            "owner_id": owner["user_id"]
        }
        
        response = session.post(
            f"{BASE_URL}/api/contacts",
            json=contact_data
        )
        assert response.status_code == 200
        created_contact = response.json()
        
        # Verify owner_id was set correctly
        assert created_contact["owner_id"] == owner["user_id"], \
            f"Owner not set correctly. Expected {owner['user_id']}, got {created_contact['owner_id']}"
        print(f"✓ Contact created with owner: {owner['name']}")
        
        # Cleanup
        session.delete(f"{BASE_URL}/api/contacts/{created_contact['contact_id']}")
        return created_contact


class TestOpportunityOwnerSelection:
    """Test opportunity creation with owner selection"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def auth_session(self, session):
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "brian.clements@compassx.com",
                "password": "CompassX2026!"
            }
        )
        assert response.status_code == 200
        return session, response.json()
    
    def test_create_opportunity_with_specific_owner(self, auth_session):
        """Test creating opportunity with a specific owner (not current user)"""
        session, current_user = auth_session
        
        # Get users
        users_response = session.get(f"{BASE_URL}/api/auth/users")
        users = users_response.json()
        
        # Get organizations
        orgs_response = session.get(f"{BASE_URL}/api/organizations")
        orgs = orgs_response.json()
        assert len(orgs) > 0, "Need at least one organization"
        
        # Get pipelines and stages
        pipelines_response = session.get(f"{BASE_URL}/api/pipelines")
        pipelines = pipelines_response.json()
        assert len(pipelines) > 0, "Need at least one pipeline"
        
        stages_response = session.get(f"{BASE_URL}/api/pipelines/{pipelines[0]['pipeline_id']}/stages")
        stages = stages_response.json()
        assert len(stages) > 0, "Need at least one stage"
        
        # Use first user as owner
        owner = users[0] if users else current_user
        
        opp_data = {
            "name": f"TEST_Opportunity_{int(time.time())}",
            "org_id": orgs[0]["org_id"],
            "engagement_type": "Advisory",
            "estimated_value": 100000,
            "confidence_level": 50,
            "pipeline_id": pipelines[0]["pipeline_id"],
            "stage_id": stages[0]["stage_id"],
            "source": "Inbound",
            "owner_id": owner["user_id"]
        }
        
        response = session.post(
            f"{BASE_URL}/api/opportunities",
            json=opp_data
        )
        assert response.status_code == 200
        created_opp = response.json()
        
        # Critical assertion: Verify owner_id was set correctly
        assert created_opp["owner_id"] == owner["user_id"], \
            f"Owner not set correctly! Expected {owner['user_id']}, got {created_opp['owner_id']}"
        print(f"✓ Opportunity created with owner_id: {created_opp['owner_id']} ({owner['name']})")
        
        # Verify by GET
        verify_response = session.get(f"{BASE_URL}/api/opportunities/{created_opp['opp_id']}")
        assert verify_response.status_code == 200
        verified_opp = verify_response.json()
        assert verified_opp["owner_id"] == owner["user_id"]
        print(f"✓ Verified opportunity owner persisted correctly")
        
        # Cleanup
        session.delete(f"{BASE_URL}/api/opportunities/{created_opp['opp_id']}")
        return created_opp


class TestAICopilot:
    """Test AI Copilot functionality"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def auth_session(self, session):
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "brian.clements@compassx.com",
                "password": "CompassX2026!"
            }
        )
        assert response.status_code == 200
        return session, response.json()
    
    @pytest.fixture(scope="class")
    def test_opportunity(self, auth_session):
        """Get an existing opportunity for AI copilot tests"""
        session, _ = auth_session
        response = session.get(f"{BASE_URL}/api/opportunities")
        assert response.status_code == 200
        opps = response.json()
        assert len(opps) > 0, "Need at least one opportunity for AI tests"
        return opps[0]
    
    def test_ai_copilot_summarize(self, auth_session, test_opportunity):
        """Test AI Copilot summarize action"""
        session, _ = auth_session
        
        response = session.post(
            f"{BASE_URL}/api/ai/copilot",
            json={
                "action": "summarize",
                "opp_id": test_opportunity["opp_id"]
            }
        )
        assert response.status_code == 200, f"AI Copilot failed: {response.text}"
        data = response.json()
        
        assert "action" in data
        assert data["action"] == "summarize"
        assert "result" in data
        assert len(data["result"]) > 0, "AI should return non-empty summary"
        print(f"✓ AI Copilot summarize returned: {data['result'][:100]}...")
    
    def test_ai_copilot_suggest_activity(self, auth_session, test_opportunity):
        """Test AI Copilot suggest_activity action"""
        session, _ = auth_session
        
        response = session.post(
            f"{BASE_URL}/api/ai/copilot",
            json={
                "action": "suggest_activity",
                "opp_id": test_opportunity["opp_id"]
            }
        )
        assert response.status_code == 200, f"AI Copilot failed: {response.text}"
        data = response.json()
        
        assert data["action"] == "suggest_activity"
        assert "result" in data
        assert len(data["result"]) > 0, "AI should return activity suggestion"
        print(f"✓ AI Copilot suggest_activity returned: {data['result'][:100]}...")
    
    def test_ai_copilot_invalid_action(self, auth_session, test_opportunity):
        """Test AI Copilot with invalid action"""
        session, _ = auth_session
        
        response = session.post(
            f"{BASE_URL}/api/ai/copilot",
            json={
                "action": "invalid_action",
                "opp_id": test_opportunity["opp_id"]
            }
        )
        assert response.status_code == 400, "Should reject invalid action"
        print(f"✓ AI Copilot correctly rejected invalid action")


class TestReportsAndAnalytics:
    """Test Reports and Analytics endpoints"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def auth_session(self, session):
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "brian.clements@compassx.com",
                "password": "CompassX2026!"
            }
        )
        assert response.status_code == 200
        return session, response.json()
    
    def test_analytics_summary(self, auth_session):
        """Test analytics summary endpoint"""
        session, _ = auth_session
        
        response = session.get(f"{BASE_URL}/api/analytics/summary")
        assert response.status_code == 200
        data = response.json()
        
        # Check summary structure
        expected_fields = [
            "total_deals", "active_deals", "won_deals", "lost_deals",
            "total_pipeline_value", "weighted_forecast", "win_rate"
        ]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        print(f"✓ Analytics summary: {data['total_deals']} deals, ${data['total_pipeline_value']:,.0f} pipeline")
    
    def test_analytics_by_owner(self, auth_session):
        """Test analytics by owner endpoint"""
        session, _ = auth_session
        
        response = session.get(f"{BASE_URL}/api/analytics/by-owner")
        assert response.status_code == 200
        data = response.json()
        
        # Should return list of owner analytics
        assert isinstance(data, list), "Should return list"
        
        if len(data) > 0:
            owner_data = data[0]
            assert "owner_id" in owner_data
            assert "owner_name" in owner_data
            assert "total" in owner_data
            assert "value" in owner_data
            print(f"✓ Analytics by owner: {len(data)} owners with data")
            for o in data:
                print(f"  - {o['owner_name']}: {o['total']} deals, ${o['value']:,.0f}")
    
    def test_analytics_pipeline(self, auth_session):
        """Test pipeline analytics endpoint"""
        session, _ = auth_session
        
        response = session.get(f"{BASE_URL}/api/analytics/pipeline")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        if len(data) > 0:
            stage_data = data[0]
            assert "stage" in stage_data
            assert "count" in stage_data
            assert "value" in stage_data
        print(f"✓ Pipeline analytics: {len(data)} stages")
    
    def test_analytics_engagement_types(self, auth_session):
        """Test engagement types analytics endpoint"""
        session, _ = auth_session
        
        response = session.get(f"{BASE_URL}/api/analytics/engagement-types")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        if len(data) > 0:
            type_data = data[0]
            assert "type" in type_data
            assert "total" in type_data
            assert "value" in type_data
        print(f"✓ Engagement types analytics: {len(data)} types")


class TestPipelineFiltering:
    """Test My Pipeline vs Main Pipeline filtering"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def auth_session(self, session):
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "brian.clements@compassx.com",
                "password": "CompassX2026!"
            }
        )
        assert response.status_code == 200
        return session, response.json()
    
    def test_main_pipeline_shows_all(self, auth_session):
        """Main pipeline (dashboard/sales) should show ALL opportunities"""
        session, _ = auth_session
        
        response = session.get(f"{BASE_URL}/api/dashboard/sales")
        assert response.status_code == 200
        data = response.json()
        
        assert "opportunities" in data
        assert "users" in data  # Should include users for owner name display
        
        all_opps = data["opportunities"]
        print(f"✓ Main Pipeline shows {len(all_opps)} opportunities (ALL)")
        
        # Verify users array is available for owner names
        assert len(data["users"]) > 0, "Should have users for owner name lookup"
        return data
    
    def test_my_pipeline_filters_by_owner(self, auth_session):
        """My Pipeline should show only current user's opportunities"""
        session, current_user = auth_session
        
        response = session.get(f"{BASE_URL}/api/dashboard/my-pipeline")
        assert response.status_code == 200
        data = response.json()
        
        assert "opportunities" in data
        my_opps = data["opportunities"]
        
        # All opportunities should belong to current user
        for opp in my_opps:
            assert opp["owner_id"] == current_user["user_id"], \
                f"My Pipeline showing opp owned by {opp['owner_id']}, expected {current_user['user_id']}"
        
        print(f"✓ My Pipeline shows {len(my_opps)} opportunities (filtered by owner: {current_user['name']})")
        return data
    
    def test_pipeline_filtering_comparison(self, auth_session):
        """Compare main pipeline vs my pipeline counts"""
        session, current_user = auth_session
        
        # Get main pipeline
        main_response = session.get(f"{BASE_URL}/api/dashboard/sales")
        main_data = main_response.json()
        main_count = len(main_data["opportunities"])
        
        # Get my pipeline
        my_response = session.get(f"{BASE_URL}/api/dashboard/my-pipeline")
        my_data = my_response.json()
        my_count = len(my_data["opportunities"])
        
        print(f"✓ Main Pipeline: {main_count} opportunities")
        print(f"✓ My Pipeline: {my_count} opportunities (owned by {current_user['name']})")
        
        # My pipeline should be less than or equal to main pipeline
        assert my_count <= main_count, \
            "My Pipeline should have fewer or equal opportunities than main pipeline"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
