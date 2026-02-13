"""
Tests for Dashboard Feature Updates - Iteration 14
Tests: Won/Lost/Active/Pipeline metrics, Create Opportunity dialog changes, Organization Summary
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuth:
    """Authentication tests to get session"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        
        # Login
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "brian.clements@compassx.com",
            "password": "CompassX2026!"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return s

class TestReportsSummary:
    """Tests for /api/reports/summary endpoint"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "brian.clements@compassx.com",
            "password": "CompassX2026!"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return s
    
    def test_reports_summary_endpoint_exists(self, session):
        """Test that /api/reports/summary endpoint returns 200"""
        response = session.get(f"{BASE_URL}/api/reports/summary")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("PASS: /api/reports/summary endpoint exists and returns 200")
    
    def test_reports_summary_has_won_metrics(self, session):
        """Test that reports summary contains won metrics"""
        response = session.get(f"{BASE_URL}/api/reports/summary")
        assert response.status_code == 200
        data = response.json()
        
        assert "won" in data, "Missing 'won' key in response"
        assert "count" in data["won"], "Missing 'count' in won metrics"
        assert "value" in data["won"], "Missing 'value' in won metrics"
        assert isinstance(data["won"]["count"], int), "won.count should be integer"
        assert isinstance(data["won"]["value"], (int, float)), "won.value should be numeric"
        print(f"PASS: Won metrics - count: {data['won']['count']}, value: {data['won']['value']}")
    
    def test_reports_summary_has_lost_metrics(self, session):
        """Test that reports summary contains lost metrics"""
        response = session.get(f"{BASE_URL}/api/reports/summary")
        assert response.status_code == 200
        data = response.json()
        
        assert "lost" in data, "Missing 'lost' key in response"
        assert "count" in data["lost"], "Missing 'count' in lost metrics"
        assert "value" in data["lost"], "Missing 'value' in lost metrics"
        print(f"PASS: Lost metrics - count: {data['lost']['count']}, value: {data['lost']['value']}")
    
    def test_reports_summary_has_active_metrics(self, session):
        """Test that reports summary contains active (Closed Won) metrics"""
        response = session.get(f"{BASE_URL}/api/reports/summary")
        assert response.status_code == 200
        data = response.json()
        
        assert "active" in data, "Missing 'active' key in response"
        assert "count" in data["active"], "Missing 'count' in active metrics"
        assert "value" in data["active"], "Missing 'value' in active metrics"
        # Active should equal Won
        assert data["active"]["count"] == data["won"]["count"], "Active count should equal Won count"
        print(f"PASS: Active metrics - count: {data['active']['count']}, value: {data['active']['value']}")
    
    def test_reports_summary_has_pipeline_metrics(self, session):
        """Test that reports summary contains pipeline (open) metrics"""
        response = session.get(f"{BASE_URL}/api/reports/summary")
        assert response.status_code == 200
        data = response.json()
        
        assert "pipeline" in data, "Missing 'pipeline' key in response"
        assert "count" in data["pipeline"], "Missing 'count' in pipeline metrics"
        assert "value" in data["pipeline"], "Missing 'value' in pipeline metrics"
        print(f"PASS: Pipeline metrics - count: {data['pipeline']['count']}, value: {data['pipeline']['value']}")
    
    def test_reports_summary_has_total_metrics(self, session):
        """Test that reports summary contains total metrics"""
        response = session.get(f"{BASE_URL}/api/reports/summary")
        assert response.status_code == 200
        data = response.json()
        
        assert "total" in data, "Missing 'total' key in response"
        assert "count" in data["total"], "Missing 'count' in total metrics"
        assert "value" in data["total"], "Missing 'value' in total metrics"
        print(f"PASS: Total metrics - count: {data['total']['count']}, value: {data['total']['value']}")


class TestOrganizationSummary:
    """Tests for /api/organizations/{org_id}/summary endpoint - pipeline and active opportunities separation"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "brian.clements@compassx.com",
            "password": "CompassX2026!"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return s
    
    @pytest.fixture(scope="class")
    def sample_org_id(self, session):
        """Get a sample organization ID for testing"""
        response = session.get(f"{BASE_URL}/api/organizations")
        assert response.status_code == 200
        orgs = response.json()
        if orgs:
            return orgs[0]["org_id"]
        pytest.skip("No organizations available for testing")
    
    def test_org_summary_returns_active_opportunities(self, session, sample_org_id):
        """Test that org summary returns active_opportunities array (Closed Won)"""
        response = session.get(f"{BASE_URL}/api/organizations/{sample_org_id}/summary")
        assert response.status_code == 200
        data = response.json()
        
        assert "active_opportunities" in data, "Missing 'active_opportunities' key"
        assert isinstance(data["active_opportunities"], list), "active_opportunities should be a list"
        print(f"PASS: active_opportunities array exists with {len(data['active_opportunities'])} items")
    
    def test_org_summary_returns_pipeline_opportunities(self, session, sample_org_id):
        """Test that org summary returns pipeline_opportunities array (Open)"""
        response = session.get(f"{BASE_URL}/api/organizations/{sample_org_id}/summary")
        assert response.status_code == 200
        data = response.json()
        
        assert "pipeline_opportunities" in data, "Missing 'pipeline_opportunities' key"
        assert isinstance(data["pipeline_opportunities"], list), "pipeline_opportunities should be a list"
        print(f"PASS: pipeline_opportunities array exists with {len(data['pipeline_opportunities'])} items")
    
    def test_org_summary_opportunities_metrics(self, session, sample_org_id):
        """Test that org summary contains opportunity metrics with won/lost values"""
        response = session.get(f"{BASE_URL}/api/organizations/{sample_org_id}/summary")
        assert response.status_code == 200
        data = response.json()
        
        assert "opportunities" in data, "Missing 'opportunities' key"
        opps = data["opportunities"]
        
        # Check for new won/lost metrics
        assert "won_count" in opps, "Missing 'won_count' in opportunities"
        assert "won_value" in opps, "Missing 'won_value' in opportunities"
        assert "lost_count" in opps, "Missing 'lost_count' in opportunities"
        assert "lost_value" in opps, "Missing 'lost_value' in opportunities"
        assert "pipeline_count" in opps, "Missing 'pipeline_count' in opportunities"
        assert "pipeline_value" in opps, "Missing 'pipeline_value' in opportunities"
        
        print(f"PASS: Org summary has won/lost/pipeline metrics")
        print(f"  - Won: {opps['won_count']} deals, ${opps['won_value']}")
        print(f"  - Lost: {opps['lost_count']} deals, ${opps['lost_value']}")
        print(f"  - Pipeline: {opps['pipeline_count']} deals, ${opps['pipeline_value']}")


class TestDashboardEndpoints:
    """Tests for main dashboard endpoint"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "brian.clements@compassx.com",
            "password": "CompassX2026!"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return s
    
    def test_dashboard_sales_endpoint(self, session):
        """Test dashboard/sales endpoint returns expected data"""
        response = session.get(f"{BASE_URL}/api/dashboard/sales")
        assert response.status_code == 200
        data = response.json()
        
        assert "opportunities" in data
        assert "metrics" in data
        assert "stages" in data
        assert "activities" in data
        print(f"PASS: Dashboard sales endpoint returns valid data with {len(data['opportunities'])} opportunities")


class TestOpportunityCreation:
    """Tests related to Create Opportunity - verifying removed fields don't cause issues"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "brian.clements@compassx.com",
            "password": "CompassX2026!"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return s
    
    @pytest.fixture(scope="class")
    def sample_org_id(self, session):
        """Get a sample organization ID for testing"""
        response = session.get(f"{BASE_URL}/api/organizations")
        assert response.status_code == 200
        orgs = response.json()
        if orgs:
            return orgs[0]["org_id"]
        pytest.skip("No organizations available for testing")
    
    @pytest.fixture(scope="class")
    def sample_user_id(self, session):
        """Get a sample user ID for testing"""
        response = session.get(f"{BASE_URL}/api/auth/users")
        assert response.status_code == 200
        users = response.json()
        if users:
            return users[0]["user_id"]
        pytest.skip("No users available for testing")
    
    @pytest.fixture(scope="class")
    def sample_stage_id(self, session):
        """Get a sample stage ID for testing"""
        response = session.get(f"{BASE_URL}/api/pipelines")
        assert response.status_code == 200
        pipelines = response.json()
        if pipelines:
            pipeline_id = pipelines[0]["pipeline_id"]
            stages_res = session.get(f"{BASE_URL}/api/pipelines/{pipeline_id}/stages")
            stages = stages_res.json()
            if stages:
                return stages[0]["stage_id"]
        pytest.skip("No stages available for testing")
    
    def test_create_opportunity_without_source_and_estimated_value(self, session, sample_org_id, sample_user_id, sample_stage_id):
        """Test that opportunity can be created without source and estimated_value fields"""
        # Create opportunity without source and estimated_value (as per new UI requirements)
        opp_data = {
            "name": "TEST_Iteration14_NoSourceNoEstValue",
            "org_id": sample_org_id,
            "owner_id": sample_user_id,
            "engagement_type": "Advisory",
            "confidence_level": 50,
            "stage_id": sample_stage_id,
            "pipeline_id": "pipe_default"
            # Intentionally NOT including: source, estimated_value
        }
        
        response = session.post(f"{BASE_URL}/api/opportunities", json=opp_data)
        assert response.status_code == 200, f"Failed to create opportunity: {response.text}"
        
        created = response.json()
        assert created["name"] == "TEST_Iteration14_NoSourceNoEstValue"
        assert "opp_id" in created
        
        # Cleanup
        opp_id = created["opp_id"]
        cleanup_res = session.delete(f"{BASE_URL}/api/opportunities/{opp_id}")
        assert cleanup_res.status_code == 200
        
        print("PASS: Opportunity created successfully without source and estimated_value fields")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
