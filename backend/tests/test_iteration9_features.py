"""
Iteration 9 Feature Tests
- DELETE /api/activities/{activity_id} endpoint
- App name 'Compass X Grow' verification
- GET /api/organizations/{org_id}/summary (buyer and opp totals)
- POST /api/organizations/{org_id}/notes (add note to history)
- Client cards with buyer, opp totals, Google Drive link
- Notes running tally on client detail page
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestActivityDelete:
    """Test DELETE /api/activities/{activity_id} endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session for authenticated requests"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "brian.clements@compassx.com", "password": "CompassX2026!"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.user = login_response.json()
    
    def test_create_and_delete_activity(self):
        """Test creating an activity and then deleting it"""
        # First get an organization to link activity to
        orgs_response = self.session.get(f"{BASE_URL}/api/organizations")
        assert orgs_response.status_code == 200
        orgs = orgs_response.json()
        assert len(orgs) > 0, "No organizations found"
        org_id = orgs[0]['org_id']
        
        # Create a test activity
        activity_data = {
            "activity_type": "Call",
            "org_id": org_id,
            "due_date": "2026-01-20T10:00:00",
            "notes": "TEST_Activity for deletion test",
            "status": "Planned"
        }
        create_response = self.session.post(
            f"{BASE_URL}/api/activities",
            json=activity_data
        )
        assert create_response.status_code == 200, f"Create activity failed: {create_response.text}"
        created_activity = create_response.json()
        activity_id = created_activity['activity_id']
        print(f"Created activity: {activity_id}")
        
        # Verify activity exists
        get_response = self.session.get(f"{BASE_URL}/api/activities/{activity_id}")
        assert get_response.status_code == 200, "Activity should exist"
        
        # Delete the activity
        delete_response = self.session.delete(f"{BASE_URL}/api/activities/{activity_id}")
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        delete_result = delete_response.json()
        assert delete_result.get("message") == "Deleted", f"Unexpected response: {delete_result}"
        print(f"Activity {activity_id} deleted successfully")
        
        # Verify activity no longer exists
        verify_response = self.session.get(f"{BASE_URL}/api/activities/{activity_id}")
        assert verify_response.status_code == 404, "Activity should not exist after deletion"
        print("Verified activity no longer exists")


class TestOrganizationSummary:
    """Test GET /api/organizations/{org_id}/summary endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "brian.clements@compassx.com", "password": "CompassX2026!"}
        )
        assert login_response.status_code == 200
    
    def test_organization_summary_endpoint_exists(self):
        """Test that summary endpoint returns buyer and opportunity totals"""
        # Get an organization
        orgs_response = self.session.get(f"{BASE_URL}/api/organizations")
        assert orgs_response.status_code == 200
        orgs = orgs_response.json()
        assert len(orgs) > 0
        org_id = orgs[0]['org_id']
        
        # Get summary
        summary_response = self.session.get(f"{BASE_URL}/api/organizations/{org_id}/summary")
        assert summary_response.status_code == 200, f"Summary endpoint failed: {summary_response.text}"
        summary = summary_response.json()
        
        # Verify structure
        assert "buyer" in summary, "Summary should contain 'buyer' field"
        assert "opportunities" in summary, "Summary should contain 'opportunities' field"
        
        opps = summary["opportunities"]
        assert "count" in opps, "Opportunities should have 'count'"
        assert "total_value" in opps, "Opportunities should have 'total_value'"
        assert "avg_confidence" in opps, "Opportunities should have 'avg_confidence'"
        
        print(f"Summary for {org_id}: buyer={summary['buyer']}, opps={opps}")


class TestOrganizationNotes:
    """Test POST /api/organizations/{org_id}/notes endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "brian.clements@compassx.com", "password": "CompassX2026!"}
        )
        assert login_response.status_code == 200
        self.user = login_response.json()
    
    def test_add_note_to_organization(self):
        """Test adding a note to an organization's notes_history"""
        # Get an organization
        orgs_response = self.session.get(f"{BASE_URL}/api/organizations")
        assert orgs_response.status_code == 200
        orgs = orgs_response.json()
        assert len(orgs) > 0
        org_id = orgs[0]['org_id']
        
        # Add a note
        note_text = f"TEST_Note added via API test at iteration 9"
        add_note_response = self.session.post(
            f"{BASE_URL}/api/organizations/{org_id}/notes",
            json={"text": note_text}
        )
        assert add_note_response.status_code == 200, f"Add note failed: {add_note_response.text}"
        note_entry = add_note_response.json()
        
        # Verify note entry structure
        assert note_entry.get("text") == note_text, "Note text should match"
        assert "created_at" in note_entry, "Note should have created_at"
        assert "created_by" in note_entry, "Note should have created_by"
        assert "created_by_name" in note_entry, "Note should have created_by_name"
        print(f"Note added: {note_entry}")
        
        # Verify note appears in organization's notes_history
        org_response = self.session.get(f"{BASE_URL}/api/organizations/{org_id}")
        assert org_response.status_code == 200
        org = org_response.json()
        
        notes_history = org.get("notes_history") or []
        matching_notes = [n for n in notes_history if n.get("text") == note_text]
        assert len(matching_notes) > 0, "Note should be in organization's notes_history"
        print(f"Verified note in notes_history for org {org_id}")
    
    def test_add_empty_note_fails(self):
        """Test that adding an empty note returns an error"""
        orgs_response = self.session.get(f"{BASE_URL}/api/organizations")
        orgs = orgs_response.json()
        org_id = orgs[0]['org_id']
        
        # Try adding empty note
        empty_note_response = self.session.post(
            f"{BASE_URL}/api/organizations/{org_id}/notes",
            json={"text": ""}
        )
        assert empty_note_response.status_code == 400, "Empty note should fail"
        print("Empty note correctly rejected")


class TestActivityCRUD:
    """Additional activity CRUD tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "brian.clements@compassx.com", "password": "CompassX2026!"}
        )
        assert login_response.status_code == 200
    
    def test_get_activities_list(self):
        """Test getting list of activities"""
        response = self.session.get(f"{BASE_URL}/api/activities")
        assert response.status_code == 200
        activities = response.json()
        assert isinstance(activities, list)
        print(f"Found {len(activities)} activities")
    
    def test_get_activities_by_org(self):
        """Test getting activities filtered by org_id"""
        # Get an org first
        orgs_response = self.session.get(f"{BASE_URL}/api/organizations")
        orgs = orgs_response.json()
        if len(orgs) > 0:
            org_id = orgs[0]['org_id']
            response = self.session.get(f"{BASE_URL}/api/activities?org_id={org_id}")
            assert response.status_code == 200
            activities = response.json()
            print(f"Found {len(activities)} activities for org {org_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
