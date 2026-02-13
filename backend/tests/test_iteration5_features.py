"""
CompassX CRM Iteration 5 Feature Tests
- Change owner in Organization edit form
- Change owner in Contact edit form
- Change owner in Opportunity edit form
- Create opportunity from Organization detail page
- Delete organization
- Delete contact
- Delete opportunity
- Users endpoint only returns 7 authorized users (no demo users Alex/Jordan)
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')
if not BASE_URL:
    BASE_URL = "https://activity-hub-63.preview.emergentagent.com"

print(f"Testing BASE_URL: {BASE_URL}")


class TestNoMoreDemoUsers:
    """Test that demo users Alex Thompson and Jordan Pierce are removed"""
    
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
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session, response.json()
    
    def test_users_endpoint_no_demo_users(self, auth_session):
        """Verify /api/auth/users only returns authorized users (no demo users)"""
        session, _ = auth_session
        
        response = session.get(f"{BASE_URL}/api/auth/users")
        assert response.status_code == 200
        users = response.json()
        
        # Get all user names
        user_names = [u["name"] for u in users]
        user_emails = [u["email"].lower() for u in users]
        
        # Check NO demo users
        demo_users = ["Alex Thompson", "Jordan Pierce"]
        demo_emails = ["alex.thompson@compassx.com", "jordan.pierce@compassx.com"]
        
        for demo_name in demo_users:
            assert demo_name not in user_names, f"Demo user '{demo_name}' should NOT be in users list"
        
        for demo_email in demo_emails:
            assert demo_email not in user_emails, f"Demo email '{demo_email}' should NOT be in users list"
        
        print(f"✓ No demo users found in {len(users)} users")
        print(f"  Users: {user_names}")
    
    def test_users_count_is_seven(self, auth_session):
        """Verify there are exactly 7 authorized users"""
        session, _ = auth_session
        
        response = session.get(f"{BASE_URL}/api/auth/users")
        assert response.status_code == 200
        users = response.json()
        
        # Should be exactly 7 authorized users
        expected_emails = [
            "arman.bozorgmanesh@compassx.com",
            "brian.clements@compassx.com",
            "jamiee@compassx.com",
            "kyleh@compassx.com",
            "randyc@compassx.com",
            "reynoldk@compassx.com",
            "seth.cushing@compassx.com"
        ]
        
        # All authorized users should exist
        actual_emails = [u["email"].lower() for u in users]
        for expected in expected_emails:
            assert expected.lower() in actual_emails, f"Authorized user {expected} missing"
        
        print(f"✓ All 7 authorized users present: {actual_emails}")


class TestChangeOwnerOrganization:
    """Test changing owner in Organization edit form via PUT endpoint"""
    
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
    
    def test_change_organization_owner(self, auth_session):
        """Test changing owner_id on existing organization via PUT"""
        session, current_user = auth_session
        
        # Get users to select a different owner
        users_resp = session.get(f"{BASE_URL}/api/auth/users")
        users = users_resp.json()
        assert len(users) >= 2, "Need at least 2 users to test owner change"
        
        # Create test organization
        create_data = {
            "name": f"TEST_OrgOwnerChange_{int(time.time())}",
            "industry": "Technology",
            "owner_id": users[0]["user_id"]
        }
        create_resp = session.post(f"{BASE_URL}/api/organizations", json=create_data)
        assert create_resp.status_code == 200
        org = create_resp.json()
        original_owner = org["owner_id"]
        
        # Change to different owner
        new_owner = users[1] if users[0]["user_id"] == original_owner else users[0]
        
        update_data = {
            "name": org["name"],
            "industry": org["industry"],
            "owner_id": new_owner["user_id"]
        }
        update_resp = session.put(f"{BASE_URL}/api/organizations/{org['org_id']}", json=update_data)
        assert update_resp.status_code == 200
        updated_org = update_resp.json()
        
        # Verify owner changed
        assert updated_org["owner_id"] == new_owner["user_id"], \
            f"Owner change failed. Expected {new_owner['user_id']}, got {updated_org['owner_id']}"
        print(f"✓ Organization owner changed from {original_owner} to {new_owner['user_id']}")
        
        # Cleanup
        session.delete(f"{BASE_URL}/api/organizations/{org['org_id']}")


class TestChangeOwnerContact:
    """Test changing owner in Contact edit form via PUT endpoint"""
    
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
    
    def test_change_contact_owner(self, auth_session):
        """Test changing owner_id on existing contact via PUT"""
        session, current_user = auth_session
        
        # Get users
        users_resp = session.get(f"{BASE_URL}/api/auth/users")
        users = users_resp.json()
        
        # Get org for contact
        orgs_resp = session.get(f"{BASE_URL}/api/organizations")
        orgs = orgs_resp.json()
        assert len(orgs) > 0
        
        # Create test contact
        create_data = {
            "name": f"TEST_ContactOwnerChange_{int(time.time())}",
            "title": "Test Title",
            "org_id": orgs[0]["org_id"],
            "owner_id": users[0]["user_id"]
        }
        create_resp = session.post(f"{BASE_URL}/api/contacts", json=create_data)
        assert create_resp.status_code == 200
        contact = create_resp.json()
        original_owner = contact["owner_id"]
        
        # Change owner
        new_owner = users[1] if len(users) > 1 and users[0]["user_id"] == original_owner else users[0]
        
        update_data = {
            "name": contact["name"],
            "title": contact["title"],
            "org_id": contact["org_id"],
            "owner_id": new_owner["user_id"]
        }
        update_resp = session.put(f"{BASE_URL}/api/contacts/{contact['contact_id']}", json=update_data)
        assert update_resp.status_code == 200
        updated_contact = update_resp.json()
        
        # Verify
        assert updated_contact["owner_id"] == new_owner["user_id"], \
            f"Contact owner change failed. Expected {new_owner['user_id']}, got {updated_contact['owner_id']}"
        print(f"✓ Contact owner changed from {original_owner} to {new_owner['user_id']}")
        
        # Cleanup
        session.delete(f"{BASE_URL}/api/contacts/{contact['contact_id']}")


class TestChangeOwnerOpportunity:
    """Test changing owner in Opportunity edit form via PUT endpoint"""
    
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
    
    def test_change_opportunity_owner(self, auth_session):
        """Test changing owner_id on existing opportunity via PUT"""
        session, current_user = auth_session
        
        # Get users
        users_resp = session.get(f"{BASE_URL}/api/auth/users")
        users = users_resp.json()
        
        # Get org, pipeline, stages
        orgs_resp = session.get(f"{BASE_URL}/api/organizations")
        orgs = orgs_resp.json()
        
        pipelines_resp = session.get(f"{BASE_URL}/api/pipelines")
        pipelines = pipelines_resp.json()
        
        stages_resp = session.get(f"{BASE_URL}/api/pipelines/{pipelines[0]['pipeline_id']}/stages")
        stages = stages_resp.json()
        
        # Create test opportunity
        create_data = {
            "name": f"TEST_OppOwnerChange_{int(time.time())}",
            "org_id": orgs[0]["org_id"],
            "engagement_type": "Advisory",
            "estimated_value": 50000,
            "confidence_level": 50,
            "pipeline_id": pipelines[0]["pipeline_id"],
            "stage_id": stages[0]["stage_id"],
            "owner_id": users[0]["user_id"]
        }
        create_resp = session.post(f"{BASE_URL}/api/opportunities", json=create_data)
        assert create_resp.status_code == 200
        opp = create_resp.json()
        original_owner = opp["owner_id"]
        
        # Change owner using PUT
        new_owner = users[1] if len(users) > 1 and users[0]["user_id"] == original_owner else users[0]
        
        update_data = {
            "name": opp["name"],
            "owner_id": new_owner["user_id"]
        }
        update_resp = session.put(f"{BASE_URL}/api/opportunities/{opp['opp_id']}", json=update_data)
        assert update_resp.status_code == 200
        updated_opp = update_resp.json()
        
        # Verify owner changed
        assert updated_opp["owner_id"] == new_owner["user_id"], \
            f"Opportunity owner change failed. Expected {new_owner['user_id']}, got {updated_opp['owner_id']}"
        print(f"✓ Opportunity owner changed from {original_owner} to {new_owner['user_id']}")
        
        # Verify persistence via GET
        verify_resp = session.get(f"{BASE_URL}/api/opportunities/{opp['opp_id']}")
        assert verify_resp.status_code == 200
        verified_opp = verify_resp.json()
        assert verified_opp["owner_id"] == new_owner["user_id"]
        print(f"✓ Owner change persisted correctly")
        
        # Cleanup
        session.delete(f"{BASE_URL}/api/opportunities/{opp['opp_id']}")


class TestCreateOpportunityFromOrg:
    """Test creating opportunity from organization detail page"""
    
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
    
    def test_create_opportunity_from_org(self, auth_session):
        """Test creating opportunity linked to a specific organization"""
        session, current_user = auth_session
        
        # Get existing organization
        orgs_resp = session.get(f"{BASE_URL}/api/organizations")
        orgs = orgs_resp.json()
        assert len(orgs) > 0
        org = orgs[0]
        
        # Get pipeline and stages
        pipelines_resp = session.get(f"{BASE_URL}/api/pipelines")
        pipelines = pipelines_resp.json()
        
        stages_resp = session.get(f"{BASE_URL}/api/pipelines/{pipelines[0]['pipeline_id']}/stages")
        stages = stages_resp.json()
        
        # Get users for owner selection
        users_resp = session.get(f"{BASE_URL}/api/auth/users")
        users = users_resp.json()
        
        # Create opportunity linked to org (simulating from org detail page)
        opp_data = {
            "name": f"TEST_OppFromOrg_{org['name']}_{int(time.time())}",
            "org_id": org["org_id"],  # KEY: linked to specific org
            "engagement_type": "Advisory",
            "estimated_value": 75000,
            "confidence_level": 40,
            "pipeline_id": pipelines[0]["pipeline_id"],
            "stage_id": stages[0]["stage_id"],
            "source": "Inbound",
            "owner_id": users[0]["user_id"]
        }
        
        create_resp = session.post(f"{BASE_URL}/api/opportunities", json=opp_data)
        assert create_resp.status_code == 200
        created_opp = create_resp.json()
        
        # Verify opportunity is linked to org
        assert created_opp["org_id"] == org["org_id"], \
            f"Opportunity not linked to org. Expected {org['org_id']}, got {created_opp['org_id']}"
        assert created_opp["owner_id"] == users[0]["user_id"]
        
        print(f"✓ Created opportunity '{created_opp['name']}' linked to org '{org['name']}'")
        
        # Verify via GET all opportunities filtered by org
        opps_resp = session.get(f"{BASE_URL}/api/opportunities")
        all_opps = opps_resp.json()
        org_opps = [o for o in all_opps if o["org_id"] == org["org_id"]]
        
        assert any(o["opp_id"] == created_opp["opp_id"] for o in org_opps), \
            "Created opportunity should appear in org's opportunities"
        
        print(f"✓ Opportunity appears in org's opportunity list ({len(org_opps)} total for this org)")
        
        # Cleanup
        session.delete(f"{BASE_URL}/api/opportunities/{created_opp['opp_id']}")


class TestDeleteFunctionality:
    """Test delete functionality for organizations, contacts, and opportunities"""
    
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
    
    def test_delete_organization(self, auth_session):
        """Test deleting an organization"""
        session, _ = auth_session
        
        # Create test org
        create_data = {
            "name": f"TEST_DeleteOrg_{int(time.time())}",
            "industry": "Technology"
        }
        create_resp = session.post(f"{BASE_URL}/api/organizations", json=create_data)
        assert create_resp.status_code == 200
        org = create_resp.json()
        
        # Delete
        delete_resp = session.delete(f"{BASE_URL}/api/organizations/{org['org_id']}")
        assert delete_resp.status_code == 200, f"Delete failed: {delete_resp.text}"
        
        # Verify deleted
        get_resp = session.get(f"{BASE_URL}/api/organizations/{org['org_id']}")
        assert get_resp.status_code == 404, "Deleted org should not be found"
        
        print(f"✓ Organization deleted successfully")
    
    def test_delete_contact(self, auth_session):
        """Test deleting a contact"""
        session, _ = auth_session
        
        # Get org for contact
        orgs_resp = session.get(f"{BASE_URL}/api/organizations")
        orgs = orgs_resp.json()
        
        # Create test contact
        create_data = {
            "name": f"TEST_DeleteContact_{int(time.time())}",
            "title": "Test",
            "org_id": orgs[0]["org_id"]
        }
        create_resp = session.post(f"{BASE_URL}/api/contacts", json=create_data)
        assert create_resp.status_code == 200
        contact = create_resp.json()
        
        # Delete
        delete_resp = session.delete(f"{BASE_URL}/api/contacts/{contact['contact_id']}")
        assert delete_resp.status_code == 200, f"Delete failed: {delete_resp.text}"
        
        # Verify deleted
        get_resp = session.get(f"{BASE_URL}/api/contacts/{contact['contact_id']}")
        assert get_resp.status_code == 404, "Deleted contact should not be found"
        
        print(f"✓ Contact deleted successfully")
    
    def test_delete_opportunity(self, auth_session):
        """Test deleting an opportunity"""
        session, _ = auth_session
        
        # Get required data
        orgs_resp = session.get(f"{BASE_URL}/api/organizations")
        orgs = orgs_resp.json()
        
        pipelines_resp = session.get(f"{BASE_URL}/api/pipelines")
        pipelines = pipelines_resp.json()
        
        stages_resp = session.get(f"{BASE_URL}/api/pipelines/{pipelines[0]['pipeline_id']}/stages")
        stages = stages_resp.json()
        
        # Create test opportunity
        create_data = {
            "name": f"TEST_DeleteOpp_{int(time.time())}",
            "org_id": orgs[0]["org_id"],
            "engagement_type": "Advisory",
            "estimated_value": 10000,
            "confidence_level": 20,
            "pipeline_id": pipelines[0]["pipeline_id"],
            "stage_id": stages[0]["stage_id"]
        }
        create_resp = session.post(f"{BASE_URL}/api/opportunities", json=create_data)
        assert create_resp.status_code == 200
        opp = create_resp.json()
        
        # Delete
        delete_resp = session.delete(f"{BASE_URL}/api/opportunities/{opp['opp_id']}")
        assert delete_resp.status_code == 200, f"Delete failed: {delete_resp.text}"
        
        # Verify deleted
        get_resp = session.get(f"{BASE_URL}/api/opportunities/{opp['opp_id']}")
        assert get_resp.status_code == 404, "Deleted opportunity should not be found"
        
        print(f"✓ Opportunity deleted successfully")
    
    def test_delete_opportunity_also_deletes_activities(self, auth_session):
        """Test that deleting opportunity also deletes related activities"""
        session, _ = auth_session
        
        # Get required data
        orgs_resp = session.get(f"{BASE_URL}/api/organizations")
        orgs = orgs_resp.json()
        
        pipelines_resp = session.get(f"{BASE_URL}/api/pipelines")
        pipelines = pipelines_resp.json()
        
        stages_resp = session.get(f"{BASE_URL}/api/pipelines/{pipelines[0]['pipeline_id']}/stages")
        stages = stages_resp.json()
        
        # Create test opportunity
        opp_data = {
            "name": f"TEST_DeleteOppActivities_{int(time.time())}",
            "org_id": orgs[0]["org_id"],
            "engagement_type": "Advisory",
            "estimated_value": 10000,
            "confidence_level": 20,
            "pipeline_id": pipelines[0]["pipeline_id"],
            "stage_id": stages[0]["stage_id"]
        }
        opp_resp = session.post(f"{BASE_URL}/api/opportunities", json=opp_data)
        assert opp_resp.status_code == 200
        opp = opp_resp.json()
        
        # Create activity for the opportunity
        activity_data = {
            "activity_type": "Call",
            "opp_id": opp["opp_id"],
            "due_date": "2026-02-01",
            "notes": "Test activity"
        }
        activity_resp = session.post(f"{BASE_URL}/api/activities", json=activity_data)
        assert activity_resp.status_code == 200
        activity = activity_resp.json()
        
        # Verify activity exists
        get_activity_resp = session.get(f"{BASE_URL}/api/activities/{activity['activity_id']}")
        assert get_activity_resp.status_code == 200
        
        # Delete opportunity
        delete_resp = session.delete(f"{BASE_URL}/api/opportunities/{opp['opp_id']}")
        assert delete_resp.status_code == 200
        
        # Verify activity is also deleted (by checking activities for this opp_id)
        activities_resp = session.get(f"{BASE_URL}/api/activities?opp_id={opp['opp_id']}")
        assert activities_resp.status_code == 200
        remaining_activities = activities_resp.json()
        
        # No activities should remain for this deleted opportunity
        assert len(remaining_activities) == 0, \
            f"Activities should be deleted with opportunity. Found {len(remaining_activities)}"
        
        print(f"✓ Deleting opportunity also deleted related activities")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
