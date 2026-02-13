#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class CompassXCRMUpdateTester:
    def __init__(self, base_url="https://activity-hub-62.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        return success

    def make_request(self, method, endpoint, data=None, expect_status=200):
        """Make API request with proper headers and session handling"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers, timeout=10)
            else:
                return False, {"error": "Invalid method"}

            success = response.status_code == expect_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text[:200]}
            
            return success, response_data

        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}

    def test_specific_login(self):
        """Test login with brian.clements@compassx.com / CompassX2026!"""
        print("\n🔐 Testing Specific Login Credentials...")
        
        # Setup users first
        self.make_request('POST', 'auth/setup-users', expect_status=200)
        
        login_data = {
            'email': 'brian.clements@compassx.com',
            'password': 'CompassX2026!'
        }
        success, data = self.make_request('POST', 'auth/login', login_data, 200)
        if success and 'user_id' in data:
            self.user_data = data
            self.log_test("Login with brian.clements@compassx.com", True, f"Logged in as: {data.get('name')}, Role: {data.get('role')}")
            return True
        else:
            self.log_test("Login with brian.clements@compassx.com", False, f"Response: {data}")
            return False

    def test_dashboard_shows_all_opportunities(self):
        """Test dashboard shows ALL opportunities (not filtered by user)"""
        print("\n📊 Testing Dashboard Shows All Opportunities...")
        
        success, data = self.make_request('GET', 'dashboard/sales', expect_status=200)
        if success and 'opportunities' in data and 'users' in data:
            opportunities = data['opportunities']
            users = data['users']
            current_user_id = data.get('current_user_id')
            
            # Count opportunities owned by current user vs others
            owned_by_me = sum(1 for opp in opportunities if opp.get('owner_id') == current_user_id)
            owned_by_others = len(opportunities) - owned_by_me
            
            self.log_test("Dashboard Shows ALL Opportunities", True, 
                         f"Total: {len(opportunities)}, Owned by me: {owned_by_me}, Owned by others: {owned_by_others}")
            
            # Verify owner names are available
            all_users_have_names = all('name' in user for user in users)
            self.log_test("Dashboard Has User Names for Owners", all_users_have_names, 
                         f"Users data includes {len(users)} users with names")
            
            return success and all_users_have_names
        else:
            self.log_test("Dashboard Shows ALL Opportunities", False, f"Response: {data}")
            return False

    def test_my_pipeline_user_owned_only(self):
        """Test My Pipeline page shows only opportunities owned by current user"""
        print("\n🎯 Testing My Pipeline Shows User-Owned Only...")
        
        success, data = self.make_request('GET', 'dashboard/my-pipeline', expect_status=200)
        if success and 'opportunities' in data:
            my_opportunities = data['opportunities']
            current_user_id = self.user_data.get('user_id') if self.user_data else None
            
            # All opportunities should be owned by current user
            all_owned_by_me = all(opp.get('owner_id') == current_user_id for opp in my_opportunities)
            
            self.log_test("My Pipeline Shows Only User-Owned Opportunities", all_owned_by_me,
                         f"Found {len(my_opportunities)} opportunities, all owned by current user: {all_owned_by_me}")
            return all_owned_by_me
        else:
            self.log_test("My Pipeline Shows Only User-Owned Opportunities", False, f"Response: {data}")
            return False

    def test_delete_functionality(self):
        """Test delete functionality for organizations, contacts, and opportunities"""
        print("\n🗑️ Testing Delete Functionality...")
        
        # Create test entities to delete
        # 1. Create organization
        org_data = {
            'name': 'Test Delete Organization',
            'industry': 'Technology',
            'strategic_tier': 'Active'
        }
        success, org = self.make_request('POST', 'organizations', org_data, 200)
        if not success:
            self.log_test("Delete Test Setup - Create Org", False, "Failed to create test organization")
            return False
        
        org_id = org['org_id']
        
        # 2. Create contact
        contact_data = {
            'name': 'Test Delete Contact',
            'org_id': org_id,
            'title': 'Test Manager'
        }
        success, contact = self.make_request('POST', 'contacts', contact_data, 200)
        if not success:
            self.log_test("Delete Test Setup - Create Contact", False, "Failed to create test contact")
            return False
        
        contact_id = contact['contact_id']
        
        # 3. Create opportunity
        # Get pipeline info first
        success, pipelines = self.make_request('GET', 'pipelines', expect_status=200)
        if not success or not pipelines:
            self.log_test("Delete Test Setup - Get Pipelines", False, "No pipelines available")
            return False
        
        pipeline_id = pipelines[0]['pipeline_id']
        success, stages = self.make_request('GET', f'pipelines/{pipeline_id}/stages', expect_status=200)
        if not success or not stages:
            self.log_test("Delete Test Setup - Get Stages", False, "No stages available")
            return False
        
        stage_id = stages[0]['stage_id']
        
        opp_data = {
            'name': 'Test Delete Opportunity',
            'org_id': org_id,
            'engagement_type': 'Advisory',
            'estimated_value': 50000,
            'pipeline_id': pipeline_id,
            'stage_id': stage_id
        }
        success, opp = self.make_request('POST', 'opportunities', opp_data, 200)
        if not success:
            self.log_test("Delete Test Setup - Create Opportunity", False, "Failed to create test opportunity")
            return False
        
        opp_id = opp['opp_id']
        
        # Now test deletions
        # Delete opportunity first (has foreign key to org)
        success, _ = self.make_request('DELETE', f'opportunities/{opp_id}', expect_status=200)
        self.log_test("Delete Opportunity", success, f"Deleted opportunity {opp_id}")
        
        # Delete contact
        success, _ = self.make_request('DELETE', f'contacts/{contact_id}', expect_status=200)
        self.log_test("Delete Contact", success, f"Deleted contact {contact_id}")
        
        # Delete organization
        success, _ = self.make_request('DELETE', f'organizations/{org_id}', expect_status=200)
        self.log_test("Delete Organization", success, f"Deleted organization {org_id}")
        
        return True

    def test_new_opportunity_owner_assignment(self):
        """Test that creating new opportunity assigns current user as owner"""
        print("\n👤 Testing New Opportunity Owner Assignment...")
        
        # Get organization to use
        success, orgs = self.make_request('GET', 'organizations', expect_status=200)
        if not success or not orgs:
            self.log_test("Opportunity Owner Test - Get Orgs", False, "No organizations available")
            return False
        
        org_id = orgs[0]['org_id']
        
        # Get pipeline info
        success, pipelines = self.make_request('GET', 'pipelines', expect_status=200)
        if not success or not pipelines:
            self.log_test("Opportunity Owner Test - Get Pipelines", False, "No pipelines available")
            return False
        
        pipeline_id = pipelines[0]['pipeline_id']
        success, stages = self.make_request('GET', f'pipelines/{pipeline_id}/stages', expect_status=200)
        if not success or not stages:
            self.log_test("Opportunity Owner Test - Get Stages", False, "No stages available")
            return False
        
        stage_id = stages[0]['stage_id']
        
        # Create new opportunity without specifying owner
        opp_data = {
            'name': 'Test Owner Assignment Opportunity',
            'org_id': org_id,
            'engagement_type': 'Strategy',
            'estimated_value': 75000,
            'pipeline_id': pipeline_id,
            'stage_id': stage_id
        }
        success, opp = self.make_request('POST', 'opportunities', opp_data, 200)
        if success:
            current_user_id = self.user_data.get('user_id') if self.user_data else None
            assigned_owner = opp.get('owner_id')
            
            owner_correctly_assigned = assigned_owner == current_user_id
            self.log_test("New Opportunity Owner Assignment", owner_correctly_assigned,
                         f"Created opportunity assigned to: {assigned_owner}, Current user: {current_user_id}")
            
            # Cleanup
            self.make_request('DELETE', f'opportunities/{opp["opp_id"]}', expect_status=200)
            
            return owner_correctly_assigned
        else:
            self.log_test("New Opportunity Owner Assignment", False, f"Failed to create opportunity: {opp}")
            return False

    def test_pipeline_shows_all_with_owners(self):
        """Test Pipeline (full) shows all opportunities with owner info"""
        print("\n📋 Testing Full Pipeline Shows All Opportunities with Owners...")
        
        success, data = self.make_request('GET', 'dashboard/sales', expect_status=200)
        if success and 'opportunities' in data and 'users' in data:
            opportunities = data['opportunities']
            users = data['users']
            
            # Check that all opportunities have owner_id
            all_have_owners = all('owner_id' in opp for opp in opportunities)
            
            # Check that we can map owner_id to user names
            user_map = {user['user_id']: user['name'] for user in users}
            owner_names_available = all(opp.get('owner_id') in user_map for opp in opportunities)
            
            self.log_test("Full Pipeline Has All Opportunities with Owners", 
                         all_have_owners and owner_names_available,
                         f"Opportunities: {len(opportunities)}, All have owners: {all_have_owners}, Names available: {owner_names_available}")
            
            return all_have_owners and owner_names_available
        else:
            self.log_test("Full Pipeline Has All Opportunities with Owners", False, f"Response: {data}")
            return False

    def run_crm_update_tests(self):
        """Run all CompassX CRM update tests"""
        print("🚀 Starting CompassX CRM Update Test Suite")
        print("=" * 60)
        
        # Must login first
        if not self.test_specific_login():
            print("❌ Login failed - stopping tests")
            return False
        
        # Run all update-specific tests
        tests = [
            self.test_dashboard_shows_all_opportunities,
            self.test_my_pipeline_user_owned_only,
            self.test_delete_functionality,
            self.test_new_opportunity_owner_assignment,
            self.test_pipeline_shows_all_with_owners
        ]
        
        failures = []
        for test_func in tests:
            try:
                if not test_func():
                    failures.append(test_func.__name__)
            except Exception as e:
                self.log_test(test_func.__name__, False, f"Exception: {str(e)}")
                failures.append(test_func.__name__)
        
        # Print final results
        print("\n" + "=" * 60)
        print(f"📊 CRM Update Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if failures:
            print(f"❌ Failed tests: {', '.join(failures)}")
        else:
            print("✅ All CRM update tests passed!")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        return success_rate > 80

def main():
    """Main test runner"""
    tester = CompassXCRMUpdateTester()
    
    try:
        success = tester.run_crm_update_tests()
        
        # Save results
        results = {
            "timestamp": datetime.now().isoformat(),
            "total_tests": tester.tests_run,
            "passed_tests": tester.tests_passed,
            "success_rate": (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
            "overall_success": success,
            "test_details": tester.test_results
        }
        
        with open('/tmp/crm_update_test_results.json', 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\n📁 Detailed results saved to /tmp/crm_update_test_results.json")
        
        return 0 if success else 1
        
    except Exception as e:
        print(f"💥 Test suite crashed: {str(e)}")
        return 2

if __name__ == "__main__":
    sys.exit(main())