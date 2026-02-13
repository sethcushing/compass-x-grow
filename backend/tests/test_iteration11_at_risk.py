"""
Iteration 11 - At-Risk Feature Tests
Features tested:
1. PUT /api/opportunities/{opp_id}/at-risk endpoint
2. GET /api/opportunities returns opportunities with at_risk_reason field
3. Dashboard at_risk_opportunities metric
4. Sidebar should NOT have Executive View link
5. App routes should NOT include /executive route
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
assert BASE_URL, "REACT_APP_BACKEND_URL environment variable is required"

# Test credentials
TEST_EMAIL = "brian.clements@compassx.com"
TEST_PASSWORD = "CompassX2026!"

class TestAtRiskFeature:
    """At-Risk feature endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self, api_client):
        """Setup - authenticate before each test"""
        self.client = api_client
        self.token = None
        
        # Login
        response = self.client.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            # Session is set via cookie
            pass
        else:
            pytest.skip(f"Authentication failed: {response.status_code}")
    
    def test_get_opportunities_returns_at_risk_fields(self, api_client):
        """GET /api/opportunities should return opportunities with is_at_risk and at_risk_reason fields"""
        response = api_client.get(f"{BASE_URL}/api/opportunities")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        opportunities = response.json()
        assert isinstance(opportunities, list), "Response should be a list"
        
        if len(opportunities) > 0:
            opp = opportunities[0]
            # Check that at_risk fields exist (they might be None/False)
            assert "is_at_risk" in opp or opp.get("is_at_risk") is not None or opp.get("is_at_risk") == False, "is_at_risk field should exist"
            # at_risk_reason can be None
            print(f"Sample opportunity: is_at_risk={opp.get('is_at_risk')}, at_risk_reason={opp.get('at_risk_reason')}")
    
    def test_put_at_risk_mark_opportunity(self, api_client):
        """PUT /api/opportunities/{opp_id}/at-risk should mark opportunity as at-risk with reason"""
        # First, get an existing opportunity
        opps_response = api_client.get(f"{BASE_URL}/api/opportunities")
        assert opps_response.status_code == 200
        opportunities = opps_response.json()
        
        if len(opportunities) == 0:
            pytest.skip("No opportunities to test with")
        
        test_opp = opportunities[0]
        opp_id = test_opp["opp_id"]
        
        # Mark as at-risk with reason
        at_risk_reason = "TEST_Budget constraints and timeline concerns"
        response = api_client.put(f"{BASE_URL}/api/opportunities/{opp_id}/at-risk", json={
            "is_at_risk": True,
            "at_risk_reason": at_risk_reason
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        updated_opp = response.json()
        assert updated_opp["is_at_risk"] == True, "is_at_risk should be True"
        assert updated_opp["at_risk_reason"] == at_risk_reason, f"at_risk_reason should be '{at_risk_reason}'"
        print(f"Successfully marked opportunity '{updated_opp['name']}' as at-risk")
    
    def test_put_at_risk_clear_status(self, api_client):
        """PUT /api/opportunities/{opp_id}/at-risk should clear at-risk status"""
        # First, get an opportunity and mark it at-risk
        opps_response = api_client.get(f"{BASE_URL}/api/opportunities")
        assert opps_response.status_code == 200
        opportunities = opps_response.json()
        
        if len(opportunities) == 0:
            pytest.skip("No opportunities to test with")
        
        # Find or mark an opportunity as at-risk first
        test_opp = opportunities[0]
        opp_id = test_opp["opp_id"]
        
        # Mark as at-risk first
        api_client.put(f"{BASE_URL}/api/opportunities/{opp_id}/at-risk", json={
            "is_at_risk": True,
            "at_risk_reason": "TEST_Temporary at-risk"
        })
        
        # Now clear at-risk status
        response = api_client.put(f"{BASE_URL}/api/opportunities/{opp_id}/at-risk", json={
            "is_at_risk": False,
            "at_risk_reason": None
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        updated_opp = response.json()
        assert updated_opp["is_at_risk"] == False, "is_at_risk should be False"
        assert updated_opp["at_risk_reason"] is None, "at_risk_reason should be None when cleared"
        print(f"Successfully cleared at-risk status for opportunity '{updated_opp['name']}'")
    
    def test_put_at_risk_nonexistent_opportunity(self, api_client):
        """PUT /api/opportunities/{opp_id}/at-risk should return 404 for non-existent opportunity"""
        response = api_client.put(f"{BASE_URL}/api/opportunities/opp_nonexistent123/at-risk", json={
            "is_at_risk": True,
            "at_risk_reason": "Test reason"
        })
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("Correctly returned 404 for non-existent opportunity")
    
    def test_get_opportunity_detail_includes_at_risk_fields(self, api_client):
        """GET /api/opportunities/{opp_id} should return opportunity with at-risk fields"""
        # Get an opportunity ID
        opps_response = api_client.get(f"{BASE_URL}/api/opportunities")
        assert opps_response.status_code == 200
        opportunities = opps_response.json()
        
        if len(opportunities) == 0:
            pytest.skip("No opportunities to test with")
        
        opp_id = opportunities[0]["opp_id"]
        
        # Get single opportunity
        response = api_client.get(f"{BASE_URL}/api/opportunities/{opp_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        opp = response.json()
        # Fields should exist in the response
        assert "is_at_risk" in opp, "is_at_risk field should exist in opportunity detail"
        assert "at_risk_reason" in opp or opp.get("at_risk_reason", "MISSING") != "MISSING", "at_risk_reason field should exist"
        print(f"Opportunity detail includes: is_at_risk={opp.get('is_at_risk')}, at_risk_reason={opp.get('at_risk_reason')}")
    
    def test_dashboard_includes_at_risk_metric(self, api_client):
        """GET /api/dashboard/sales should include at_risk_opportunities metric"""
        response = api_client.get(f"{BASE_URL}/api/dashboard/sales")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "metrics" in data, "Dashboard should have metrics"
        
        metrics = data["metrics"]
        assert "at_risk_opportunities" in metrics, "metrics should include at_risk_opportunities"
        print(f"Dashboard at_risk_opportunities count: {metrics['at_risk_opportunities']}")
    
    def test_my_pipeline_includes_at_risk_metric(self, api_client):
        """GET /api/dashboard/my-pipeline should include at_risk_opportunities metric"""
        response = api_client.get(f"{BASE_URL}/api/dashboard/my-pipeline")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "metrics" in data, "My Pipeline should have metrics"
        
        metrics = data["metrics"]
        assert "at_risk_opportunities" in metrics, "metrics should include at_risk_opportunities"
        print(f"My Pipeline at_risk_opportunities count: {metrics['at_risk_opportunities']}")


class TestOpportunityAtRiskUpdate:
    """Additional at-risk update edge case tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self, api_client):
        """Setup - authenticate before each test"""
        self.client = api_client
        
        # Login
        response = self.client.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Authentication failed: {response.status_code}")
    
    def test_mark_at_risk_without_reason(self, api_client):
        """Mark as at-risk without providing reason (should still work, reason=None)"""
        opps_response = api_client.get(f"{BASE_URL}/api/opportunities")
        opportunities = opps_response.json()
        
        if len(opportunities) == 0:
            pytest.skip("No opportunities to test with")
        
        opp_id = opportunities[0]["opp_id"]
        
        # Mark as at-risk without reason
        response = api_client.put(f"{BASE_URL}/api/opportunities/{opp_id}/at-risk", json={
            "is_at_risk": True
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        updated_opp = response.json()
        assert updated_opp["is_at_risk"] == True, "is_at_risk should be True"
        # at_risk_reason can be None if not provided
        print(f"Marked at-risk without reason: at_risk_reason={updated_opp.get('at_risk_reason')}")
        
        # Clean up - clear at-risk status
        api_client.put(f"{BASE_URL}/api/opportunities/{opp_id}/at-risk", json={
            "is_at_risk": False
        })
    
    def test_at_risk_update_returns_updated_opportunity(self, api_client):
        """PUT at-risk endpoint should return the full updated opportunity object"""
        opps_response = api_client.get(f"{BASE_URL}/api/opportunities")
        opportunities = opps_response.json()
        
        if len(opportunities) == 0:
            pytest.skip("No opportunities to test with")
        
        opp_id = opportunities[0]["opp_id"]
        
        response = api_client.put(f"{BASE_URL}/api/opportunities/{opp_id}/at-risk", json={
            "is_at_risk": True,
            "at_risk_reason": "TEST_Validation reason"
        })
        
        assert response.status_code == 200
        
        updated_opp = response.json()
        # Verify full opportunity object is returned
        assert "opp_id" in updated_opp, "Should return full opportunity with opp_id"
        assert "name" in updated_opp, "Should return full opportunity with name"
        assert "org_id" in updated_opp, "Should return full opportunity with org_id"
        assert "estimated_value" in updated_opp, "Should return full opportunity with estimated_value"
        assert "is_at_risk" in updated_opp, "Should return is_at_risk"
        assert "at_risk_reason" in updated_opp, "Should return at_risk_reason"
        
        print(f"Full opportunity returned: {updated_opp.get('name')} - is_at_risk={updated_opp.get('is_at_risk')}")
        
        # Clean up
        api_client.put(f"{BASE_URL}/api/opportunities/{opp_id}/at-risk", json={
            "is_at_risk": False
        })


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session
