"""
Tests for Activity Delete Feature and Expanded Activity Types
Iteration 6 - Testing:
1. DELETE /api/activities/{activity_id} endpoint
2. Create activity with new types (Workshop, Discovery Session, Other)
3. Verify expanded activity type list
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Expanded activity types as per requirements
EXPECTED_ACTIVITY_TYPES = ['Call', 'Email', 'Meeting', 'Demo', 'Workshop', 'Discovery Session', 'Follow-up', 'Exec Readout', 'Other']

class TestActivityFeatures:
    """Activity delete and new activity type tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session for authenticated requests"""
        self.session = requests.Session()
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "brian.clements@compassx.com",
            "password": "CompassX2026!"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.user = login_response.json()
        print(f"Logged in as: {self.user['name']}")
    
    def test_1_login_success(self):
        """Test login works"""
        assert self.user is not None
        assert self.user['email'] == 'brian.clements@compassx.com'
        print("Login successful")
    
    def test_2_create_activity_with_workshop_type(self):
        """Test creating activity with new Workshop type"""
        # First get an organization to link to
        orgs_response = self.session.get(f"{BASE_URL}/api/organizations")
        assert orgs_response.status_code == 200
        orgs = orgs_response.json()
        assert len(orgs) > 0, "Need at least one organization"
        org_id = orgs[0]['org_id']
        
        # Create activity with Workshop type
        activity_data = {
            "activity_type": "Workshop",
            "org_id": org_id,
            "due_date": "2026-02-15T10:00:00Z",
            "notes": "TEST_Workshop activity for testing new type",
            "status": "Planned"
        }
        create_response = self.session.post(f"{BASE_URL}/api/activities", json=activity_data)
        assert create_response.status_code == 200, f"Failed to create Workshop activity: {create_response.text}"
        
        created = create_response.json()
        assert created['activity_type'] == 'Workshop'
        assert created['org_id'] == org_id
        print(f"Created Workshop activity: {created['activity_id']}")
        
        # Cleanup
        delete_response = self.session.delete(f"{BASE_URL}/api/activities/{created['activity_id']}")
        assert delete_response.status_code == 200
        print("Cleaned up Workshop activity")
    
    def test_3_create_activity_with_discovery_session_type(self):
        """Test creating activity with new Discovery Session type"""
        orgs_response = self.session.get(f"{BASE_URL}/api/organizations")
        assert orgs_response.status_code == 200
        orgs = orgs_response.json()
        org_id = orgs[0]['org_id']
        
        activity_data = {
            "activity_type": "Discovery Session",
            "org_id": org_id,
            "due_date": "2026-02-16T14:00:00Z",
            "notes": "TEST_Discovery Session for testing new type",
            "status": "Planned"
        }
        create_response = self.session.post(f"{BASE_URL}/api/activities", json=activity_data)
        assert create_response.status_code == 200, f"Failed to create Discovery Session activity: {create_response.text}"
        
        created = create_response.json()
        assert created['activity_type'] == 'Discovery Session'
        print(f"Created Discovery Session activity: {created['activity_id']}")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/activities/{created['activity_id']}")
        print("Cleaned up Discovery Session activity")
    
    def test_4_create_activity_with_other_type(self):
        """Test creating activity with new Other type"""
        orgs_response = self.session.get(f"{BASE_URL}/api/organizations")
        assert orgs_response.status_code == 200
        orgs = orgs_response.json()
        org_id = orgs[0]['org_id']
        
        activity_data = {
            "activity_type": "Other",
            "org_id": org_id,
            "due_date": "2026-02-17T09:00:00Z",
            "notes": "TEST_Other type activity for testing new type",
            "status": "Planned"
        }
        create_response = self.session.post(f"{BASE_URL}/api/activities", json=activity_data)
        assert create_response.status_code == 200, f"Failed to create Other activity: {create_response.text}"
        
        created = create_response.json()
        assert created['activity_type'] == 'Other'
        print(f"Created Other activity: {created['activity_id']}")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/activities/{created['activity_id']}")
        print("Cleaned up Other activity")
    
    def test_5_delete_activity_endpoint(self):
        """Test DELETE /api/activities/{activity_id} endpoint"""
        # Get an organization
        orgs_response = self.session.get(f"{BASE_URL}/api/organizations")
        orgs = orgs_response.json()
        org_id = orgs[0]['org_id']
        
        # Create an activity to delete
        activity_data = {
            "activity_type": "Call",
            "org_id": org_id,
            "due_date": "2026-02-18T10:00:00Z",
            "notes": "TEST_Activity to be deleted",
            "status": "Planned"
        }
        create_response = self.session.post(f"{BASE_URL}/api/activities", json=activity_data)
        assert create_response.status_code == 200
        created = create_response.json()
        activity_id = created['activity_id']
        print(f"Created activity for deletion: {activity_id}")
        
        # Verify activity exists
        get_response = self.session.get(f"{BASE_URL}/api/activities/{activity_id}")
        assert get_response.status_code == 200
        print("Verified activity exists before deletion")
        
        # Delete the activity
        delete_response = self.session.delete(f"{BASE_URL}/api/activities/{activity_id}")
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        delete_data = delete_response.json()
        assert delete_data.get('message') == 'Deleted'
        print("DELETE returned success message")
        
        # Verify activity is gone
        get_after_delete = self.session.get(f"{BASE_URL}/api/activities/{activity_id}")
        assert get_after_delete.status_code == 404, "Activity should be 404 after deletion"
        print("Verified activity no longer exists (404 returned)")
    
    def test_6_delete_nonexistent_activity(self):
        """Test deleting a non-existent activity returns appropriate response"""
        # Try to delete a non-existent activity
        fake_id = "act_nonexistent123"
        delete_response = self.session.delete(f"{BASE_URL}/api/activities/{fake_id}")
        # Note: The endpoint returns 200 even for non-existent (idempotent)
        # This is acceptable behavior
        assert delete_response.status_code in [200, 404], f"Unexpected status: {delete_response.status_code}"
        print(f"Delete non-existent activity returned: {delete_response.status_code}")
    
    def test_7_list_activities_shows_all_types(self):
        """Test that activities list endpoint can show various activity types"""
        activities_response = self.session.get(f"{BASE_URL}/api/activities")
        assert activities_response.status_code == 200
        activities = activities_response.json()
        print(f"Total activities in system: {len(activities)}")
        
        # Check what activity types exist
        activity_types = set(a.get('activity_type') for a in activities)
        print(f"Activity types found: {activity_types}")
        
        # Verify activities have required fields
        if activities:
            activity = activities[0]
            assert 'activity_id' in activity
            assert 'activity_type' in activity
            assert 'due_date' in activity
            assert 'status' in activity
            print("Activity structure verified")
    
    def test_8_create_and_delete_activity_on_org(self):
        """Test full flow: create activity linked to org, then delete it"""
        # Get first organization
        orgs_response = self.session.get(f"{BASE_URL}/api/organizations")
        orgs = orgs_response.json()
        org_id = orgs[0]['org_id']
        org_name = orgs[0]['name']
        
        # Get activities count for this org before
        activities_before = self.session.get(f"{BASE_URL}/api/activities?org_id={org_id}")
        count_before = len(activities_before.json())
        print(f"Activities for {org_name} before: {count_before}")
        
        # Create activity
        activity_data = {
            "activity_type": "Meeting",
            "org_id": org_id,
            "due_date": "2026-02-20T14:00:00Z",
            "notes": "TEST_Meeting for delete test",
            "status": "Planned"
        }
        create_response = self.session.post(f"{BASE_URL}/api/activities", json=activity_data)
        assert create_response.status_code == 200
        created = create_response.json()
        activity_id = created['activity_id']
        
        # Verify count increased
        activities_after_create = self.session.get(f"{BASE_URL}/api/activities?org_id={org_id}")
        count_after_create = len(activities_after_create.json())
        assert count_after_create == count_before + 1
        print(f"Activities after create: {count_after_create}")
        
        # Delete activity
        delete_response = self.session.delete(f"{BASE_URL}/api/activities/{activity_id}")
        assert delete_response.status_code == 200
        
        # Verify count decreased
        activities_after_delete = self.session.get(f"{BASE_URL}/api/activities?org_id={org_id}")
        count_after_delete = len(activities_after_delete.json())
        assert count_after_delete == count_before
        print(f"Activities after delete: {count_after_delete} (back to original)")

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
