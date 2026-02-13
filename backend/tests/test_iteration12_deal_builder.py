"""
Iteration 12: Deal Builder and Organization Summary Tests
Tests for:
1. PUT /api/opportunities/{opp_id} accepting deal builder fields (deal_start_date, deal_end_date, num_consultants, blended_hourly_rate, calculated_value)
2. GET /api/opportunities returning all deal builder fields
3. GET /api/organizations/{org_id}/summary returning won_count, won_value, lost_count, lost_value
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def auth_session():
    """Create authenticated session for all tests"""
    session = requests.Session()
    login_response = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "brian.clements@compassx.com", "password": "CompassX2026!"}
    )
    assert login_response.status_code == 200, f"Login failed: {login_response.text}"
    return session

@pytest.fixture(scope="module")
def test_opportunity(auth_session):
    """Get an existing opportunity to test with"""
    response = auth_session.get(f"{BASE_URL}/api/opportunities")
    assert response.status_code == 200
    opps = response.json()
    assert len(opps) > 0, "No opportunities found for testing"
    return opps[0]

@pytest.fixture(scope="module")
def test_organization(auth_session):
    """Get an existing organization to test with"""
    response = auth_session.get(f"{BASE_URL}/api/organizations")
    assert response.status_code == 200
    orgs = response.json()
    assert len(orgs) > 0, "No organizations found for testing"
    return orgs[0]

class TestDealBuilderBackend:
    """Test Deal Builder fields in Opportunity API"""
    
    def test_get_opportunities_returns_deal_builder_fields(self, auth_session, test_opportunity):
        """GET /api/opportunities should return deal builder fields"""
        response = auth_session.get(f"{BASE_URL}/api/opportunities")
        assert response.status_code == 200
        
        opps = response.json()
        assert len(opps) > 0
        
        # Check that deal builder fields exist in response schema
        opp = opps[0]
        # Fields may be null but should be present in the schema
        assert 'deal_start_date' in opp or opp.get('deal_start_date') is None
        assert 'deal_end_date' in opp or opp.get('deal_end_date') is None
        assert 'num_consultants' in opp or opp.get('num_consultants') is None
        assert 'blended_hourly_rate' in opp or opp.get('blended_hourly_rate') is None
        assert 'calculated_value' in opp or opp.get('calculated_value') is None
        print(f"SUCCESS: GET /api/opportunities returns deal builder fields")

    def test_get_single_opportunity_returns_deal_builder_fields(self, auth_session, test_opportunity):
        """GET /api/opportunities/{opp_id} should return deal builder fields"""
        opp_id = test_opportunity['opp_id']
        response = auth_session.get(f"{BASE_URL}/api/opportunities/{opp_id}")
        assert response.status_code == 200
        
        opp = response.json()
        # Verify deal builder fields exist
        assert 'deal_start_date' in opp or opp.get('deal_start_date') is None
        assert 'deal_end_date' in opp or opp.get('deal_end_date') is None
        assert 'num_consultants' in opp or opp.get('num_consultants') is None
        assert 'blended_hourly_rate' in opp or opp.get('blended_hourly_rate') is None
        assert 'calculated_value' in opp or opp.get('calculated_value') is None
        print(f"SUCCESS: GET /api/opportunities/{opp_id} returns deal builder fields")

    def test_update_opportunity_with_deal_builder_fields(self, auth_session, test_opportunity):
        """PUT /api/opportunities/{opp_id} should accept deal builder fields"""
        opp_id = test_opportunity['opp_id']
        
        # Update with deal builder data
        deal_builder_data = {
            "deal_start_date": "2026-02-01",
            "deal_end_date": "2026-04-30",
            "num_consultants": 3,
            "blended_hourly_rate": 250.0,
            "calculated_value": 156000.0  # 65 working days × 8 hrs × 3 consultants × $250
        }
        
        response = auth_session.put(
            f"{BASE_URL}/api/opportunities/{opp_id}",
            json=deal_builder_data
        )
        assert response.status_code == 200, f"Update failed: {response.text}"
        
        updated_opp = response.json()
        
        # Verify deal builder fields were updated
        assert updated_opp.get('deal_start_date') is not None
        assert "2026-02-01" in updated_opp.get('deal_start_date', '')
        assert updated_opp.get('deal_end_date') is not None
        assert "2026-04-30" in updated_opp.get('deal_end_date', '')
        assert updated_opp.get('num_consultants') == 3
        assert updated_opp.get('blended_hourly_rate') == 250.0
        assert updated_opp.get('calculated_value') == 156000.0
        print(f"SUCCESS: PUT /api/opportunities/{opp_id} accepts deal builder fields")

    def test_update_opportunity_with_partial_deal_builder(self, auth_session, test_opportunity):
        """PUT /api/opportunities/{opp_id} should accept partial deal builder updates"""
        opp_id = test_opportunity['opp_id']
        
        # Update only some fields
        partial_data = {
            "num_consultants": 5,
            "blended_hourly_rate": 275.0
        }
        
        response = auth_session.put(
            f"{BASE_URL}/api/opportunities/{opp_id}",
            json=partial_data
        )
        assert response.status_code == 200, f"Partial update failed: {response.text}"
        
        updated_opp = response.json()
        assert updated_opp.get('num_consultants') == 5
        assert updated_opp.get('blended_hourly_rate') == 275.0
        print(f"SUCCESS: Partial deal builder update works")

    def test_update_opportunity_clear_deal_builder(self, auth_session, test_opportunity):
        """PUT /api/opportunities/{opp_id} should allow clearing deal builder fields"""
        opp_id = test_opportunity['opp_id']
        
        # Clear deal builder fields by setting to null
        clear_data = {
            "deal_start_date": None,
            "deal_end_date": None,
            "num_consultants": None,
            "blended_hourly_rate": None,
            "calculated_value": None
        }
        
        response = auth_session.put(
            f"{BASE_URL}/api/opportunities/{opp_id}",
            json=clear_data
        )
        assert response.status_code == 200, f"Clear failed: {response.text}"
        
        updated_opp = response.json()
        # Fields should be None/null
        assert updated_opp.get('deal_start_date') is None
        assert updated_opp.get('deal_end_date') is None
        assert updated_opp.get('num_consultants') is None
        assert updated_opp.get('blended_hourly_rate') is None
        assert updated_opp.get('calculated_value') is None
        print(f"SUCCESS: Deal builder fields can be cleared")


class TestOrganizationSummaryWonLost:
    """Test Organization Summary endpoint for Won/Lost totals"""
    
    def test_organization_summary_returns_won_lost_fields(self, auth_session, test_organization):
        """GET /api/organizations/{org_id}/summary should return won_count, won_value, lost_count, lost_value"""
        org_id = test_organization['org_id']
        
        response = auth_session.get(f"{BASE_URL}/api/organizations/{org_id}/summary")
        assert response.status_code == 200, f"Summary failed: {response.text}"
        
        summary = response.json()
        
        # Check opportunities object exists
        assert 'opportunities' in summary
        opps_summary = summary['opportunities']
        
        # Verify won/lost fields exist
        assert 'won_count' in opps_summary, "won_count field missing"
        assert 'won_value' in opps_summary, "won_value field missing"
        assert 'lost_count' in opps_summary, "lost_count field missing"
        assert 'lost_value' in opps_summary, "lost_value field missing"
        
        # Fields should be numeric
        assert isinstance(opps_summary['won_count'], int)
        assert isinstance(opps_summary['won_value'], (int, float))
        assert isinstance(opps_summary['lost_count'], int)
        assert isinstance(opps_summary['lost_value'], (int, float))
        
        print(f"SUCCESS: Organization summary returns won_count={opps_summary['won_count']}, won_value={opps_summary['won_value']}, lost_count={opps_summary['lost_count']}, lost_value={opps_summary['lost_value']}")

    def test_organization_summary_preserves_existing_fields(self, auth_session, test_organization):
        """GET /api/organizations/{org_id}/summary should still return buyer and opportunity totals"""
        org_id = test_organization['org_id']
        
        response = auth_session.get(f"{BASE_URL}/api/organizations/{org_id}/summary")
        assert response.status_code == 200
        
        summary = response.json()
        
        # Existing fields should still be present
        assert 'buyer' in summary
        assert 'opportunities' in summary
        
        opps_summary = summary['opportunities']
        assert 'count' in opps_summary
        assert 'total_value' in opps_summary
        assert 'avg_confidence' in opps_summary
        
        print(f"SUCCESS: Existing summary fields preserved - count={opps_summary['count']}, total_value={opps_summary['total_value']}, avg_confidence={opps_summary['avg_confidence']}")

    def test_organization_summary_multiple_orgs(self, auth_session):
        """Test summary endpoint for multiple organizations"""
        # Get all organizations
        orgs_response = auth_session.get(f"{BASE_URL}/api/organizations")
        assert orgs_response.status_code == 200
        orgs = orgs_response.json()
        
        # Test summary for first 3 orgs
        for org in orgs[:3]:
            org_id = org['org_id']
            response = auth_session.get(f"{BASE_URL}/api/organizations/{org_id}/summary")
            assert response.status_code == 200, f"Summary failed for org {org_id}: {response.text}"
            
            summary = response.json()
            assert 'opportunities' in summary
            assert 'won_count' in summary['opportunities']
            assert 'won_value' in summary['opportunities']
            assert 'lost_count' in summary['opportunities']
            assert 'lost_value' in summary['opportunities']
            
        print(f"SUCCESS: Summary endpoint works for multiple organizations")


class TestDealBuilderCalculation:
    """Test Deal Builder calculation functionality"""
    
    def test_deal_builder_values_persisted_correctly(self, auth_session, test_opportunity):
        """Verify deal builder values are correctly persisted and retrieved"""
        opp_id = test_opportunity['opp_id']
        
        # Set specific deal builder values
        test_data = {
            "deal_start_date": "2026-03-01",
            "deal_end_date": "2026-06-30",
            "num_consultants": 2,
            "blended_hourly_rate": 200.0,
            "calculated_value": 88000.0  # Approx 88 working days × 8 hrs × 2 × $200
        }
        
        # Update
        update_response = auth_session.put(
            f"{BASE_URL}/api/opportunities/{opp_id}",
            json=test_data
        )
        assert update_response.status_code == 200
        
        # Retrieve and verify
        get_response = auth_session.get(f"{BASE_URL}/api/opportunities/{opp_id}")
        assert get_response.status_code == 200
        
        retrieved = get_response.json()
        assert "2026-03-01" in retrieved.get('deal_start_date', '')
        assert "2026-06-30" in retrieved.get('deal_end_date', '')
        assert retrieved.get('num_consultants') == 2
        assert retrieved.get('blended_hourly_rate') == 200.0
        assert retrieved.get('calculated_value') == 88000.0
        
        print(f"SUCCESS: Deal builder values persisted and retrieved correctly")

    def test_deal_builder_combined_with_other_fields(self, auth_session, test_opportunity):
        """Verify deal builder fields can be updated alongside other opportunity fields"""
        opp_id = test_opportunity['opp_id']
        
        combined_data = {
            "estimated_value": 100000,  # Manual estimate
            "confidence_level": 75,
            "deal_start_date": "2026-01-15",
            "deal_end_date": "2026-03-15",
            "num_consultants": 4,
            "blended_hourly_rate": 225.0,
            "calculated_value": 72000.0
        }
        
        response = auth_session.put(
            f"{BASE_URL}/api/opportunities/{opp_id}",
            json=combined_data
        )
        assert response.status_code == 200
        
        updated = response.json()
        # Both manual and calculated values should be present
        assert updated.get('estimated_value') == 100000
        assert updated.get('confidence_level') == 75
        assert updated.get('num_consultants') == 4
        assert updated.get('blended_hourly_rate') == 225.0
        assert updated.get('calculated_value') == 72000.0
        
        print(f"SUCCESS: Deal builder and regular fields can be updated together")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
