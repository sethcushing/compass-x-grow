"""
Iteration 10 Feature Tests
Tests for:
1. Dashboard 'Top Opportunities by Client' grouping
2. Dashboard 'At-Risk Deals' metric with client count badge
3. Activities color coordination by type
4. Activities title field
5. App name 'Compass X Grow'
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://activity-hub-63.preview.emergentagent.com').rstrip('/')

class TestActivitiesTitle:
    """Test activity title field functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session"""
        self.session = requests.Session()
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "brian.clements@compassx.com",
            "password": "CompassX2026!"
        })
        assert login_response.status_code == 200, "Login failed"
        self.user = login_response.json()
        yield
        # Cleanup test data
        self._cleanup_test_activities()
    
    def _cleanup_test_activities(self):
        """Clean up test activities"""
        try:
            activities = self.session.get(f"{BASE_URL}/api/activities").json()
            for act in activities:
                if act.get('title', '').startswith('TEST_'):
                    self.session.delete(f"{BASE_URL}/api/activities/{act['activity_id']}")
        except:
            pass
    
    def test_create_activity_with_title(self):
        """Test creating activity with title field"""
        # Get an organization to link the activity
        orgs = self.session.get(f"{BASE_URL}/api/organizations").json()
        assert len(orgs) > 0, "No organizations found"
        org_id = orgs[0]['org_id']
        
        # Create activity with title
        due_date = (datetime.utcnow() + timedelta(days=1)).isoformat()
        activity_data = {
            "activity_type": "Call",
            "title": "TEST_Title_Field_Iteration10",
            "org_id": org_id,
            "due_date": due_date,
            "notes": "Testing title field",
            "status": "Planned"
        }
        
        response = self.session.post(f"{BASE_URL}/api/activities", json=activity_data)
        assert response.status_code == 200, f"Failed to create activity: {response.text}"
        
        created = response.json()
        assert created['title'] == "TEST_Title_Field_Iteration10", "Title not saved correctly"
        assert created['activity_type'] == "Call"
        assert 'activity_id' in created
        
        print(f"SUCCESS: Activity created with title '{created['title']}'")
        
        # Verify via GET
        get_response = self.session.get(f"{BASE_URL}/api/activities/{created['activity_id']}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched['title'] == "TEST_Title_Field_Iteration10"
        
        print("SUCCESS: Title field persisted in database")
    
    def test_activity_types_supported(self):
        """Test that all activity types are supported"""
        activity_types = [
            "Call", "Email", "Meeting", "Demo", 
            "Workshop", "Discovery Session", "Follow-up", 
            "Exec Readout", "Other"
        ]
        
        orgs = self.session.get(f"{BASE_URL}/api/organizations").json()
        org_id = orgs[0]['org_id']
        
        for act_type in activity_types:
            due_date = (datetime.utcnow() + timedelta(days=1)).isoformat()
            activity_data = {
                "activity_type": act_type,
                "title": f"TEST_{act_type}_Type",
                "org_id": org_id,
                "due_date": due_date,
                "status": "Planned"
            }
            
            response = self.session.post(f"{BASE_URL}/api/activities", json=activity_data)
            assert response.status_code == 200, f"Failed to create {act_type} activity: {response.text}"
            
            created = response.json()
            assert created['activity_type'] == act_type
            print(f"SUCCESS: {act_type} activity type supported")


class TestDashboardFeatures:
    """Test dashboard-specific features"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session"""
        self.session = requests.Session()
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "brian.clements@compassx.com",
            "password": "CompassX2026!"
        })
        assert login_response.status_code == 200, "Login failed"
        yield
    
    def test_dashboard_returns_opportunities(self):
        """Test that dashboard returns opportunities for 'Top Opportunities by Client' section"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/sales")
        assert response.status_code == 200
        
        data = response.json()
        assert 'opportunities' in data, "Missing opportunities in dashboard response"
        assert 'metrics' in data, "Missing metrics in dashboard response"
        
        # Verify opportunities have org_id for client grouping
        for opp in data['opportunities']:
            assert 'org_id' in opp, "Opportunity missing org_id for client grouping"
            assert 'estimated_value' in opp, "Opportunity missing estimated_value"
        
        print(f"SUCCESS: Dashboard returns {len(data['opportunities'])} opportunities for client grouping")
    
    def test_dashboard_at_risk_metrics(self):
        """Test that dashboard includes at-risk deals metric"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/sales")
        assert response.status_code == 200
        
        data = response.json()
        metrics = data.get('metrics', {})
        
        assert 'at_risk_opportunities' in metrics, "Missing at_risk_opportunities metric"
        assert isinstance(metrics['at_risk_opportunities'], int), "at_risk_opportunities should be integer"
        
        print(f"SUCCESS: Dashboard shows {metrics['at_risk_opportunities']} at-risk opportunities")
    
    def test_organizations_have_at_risk_status(self):
        """Test that organizations include is_at_risk field for client badge"""
        response = self.session.get(f"{BASE_URL}/api/organizations")
        assert response.status_code == 200
        
        orgs = response.json()
        assert len(orgs) > 0, "No organizations found"
        
        for org in orgs:
            assert 'is_at_risk' in org, f"Organization {org.get('name')} missing is_at_risk field"
            assert isinstance(org['is_at_risk'], bool), "is_at_risk should be boolean"
        
        at_risk_count = sum(1 for org in orgs if org['is_at_risk'])
        print(f"SUCCESS: {at_risk_count} of {len(orgs)} organizations are at-risk")
    
    def test_dashboard_activities_for_color_coding(self):
        """Test that dashboard returns activities with activity_type for color coding"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/sales")
        assert response.status_code == 200
        
        data = response.json()
        assert 'activities' in data, "Missing activities in dashboard response"
        
        for activity in data['activities']:
            assert 'activity_type' in activity, "Activity missing activity_type for color coding"
            assert 'title' in activity or 'activity_id' in activity, "Activity missing title/id"
        
        print(f"SUCCESS: Dashboard returns {len(data['activities'])} activities with type for color coding")


class TestOrganizationDetailActivityDialog:
    """Test organization detail page activity dialog features"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session"""
        self.session = requests.Session()
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "brian.clements@compassx.com",
            "password": "CompassX2026!"
        })
        assert login_response.status_code == 200, "Login failed"
        yield
        # Cleanup
        self._cleanup_test_activities()
    
    def _cleanup_test_activities(self):
        """Clean up test activities"""
        try:
            activities = self.session.get(f"{BASE_URL}/api/activities").json()
            for act in activities:
                if act.get('title', '').startswith('TEST_'):
                    self.session.delete(f"{BASE_URL}/api/activities/{act['activity_id']}")
        except:
            pass
    
    def test_create_activity_for_organization(self):
        """Test creating activity directly for an organization (from org detail page)"""
        orgs = self.session.get(f"{BASE_URL}/api/organizations").json()
        assert len(orgs) > 0, "No organizations found"
        org_id = orgs[0]['org_id']
        org_name = orgs[0]['name']
        
        due_date = (datetime.utcnow() + timedelta(days=2)).isoformat()
        activity_data = {
            "activity_type": "Meeting",
            "title": "TEST_OrgDetail_Activity",
            "org_id": org_id,
            "due_date": due_date,
            "notes": "Created from org detail page",
            "status": "Planned"
        }
        
        response = self.session.post(f"{BASE_URL}/api/activities", json=activity_data)
        assert response.status_code == 200, f"Failed to create activity: {response.text}"
        
        created = response.json()
        assert created['org_id'] == org_id, "Activity not linked to organization"
        assert created['title'] == "TEST_OrgDetail_Activity"
        
        print(f"SUCCESS: Activity created for organization '{org_name}' with title")
        
        # Verify activity appears in org's activities
        activities = self.session.get(f"{BASE_URL}/api/activities?org_id={org_id}").json()
        found = any(a['activity_id'] == created['activity_id'] for a in activities)
        assert found, "Activity not found in organization's activities"
        
        print("SUCCESS: Activity appears in organization's activity list")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
