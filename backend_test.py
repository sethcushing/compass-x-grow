#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class CompassXAPITester:
    def __init__(self, base_url="https://engage-track-5.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session_token = None
        self.user_data = None
        self.session = requests.Session()  # Use session to handle cookies
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
        
        # Add session token if available
        if self.session_token:
            headers['Authorization'] = f'Bearer {self.session_token}'

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

    def test_jwt_login(self):
        """Test JWT-based login functionality"""
        print("\n🔐 Testing Authentication...")
        
        # First ensure users are set up
        self.make_request('POST', 'auth/setup-users', expect_status=200)
        
        # Test Admin Login
        login_data = {
            'email': 'brian.clements@compassx.com',
            'password': 'CompassX2026!'
        }
        success, data = self.make_request('POST', 'auth/login', login_data, 200)
        if success and 'user_id' in data:
            self.user_data = data
            self.log_test("JWT Login (Admin)", True, f"User: {data.get('name')}, Role: {data.get('role')}")
            return True
        else:
            self.log_test("JWT Login (Admin)", False, f"Response: {data}")
            return False
    
    def test_invalid_login(self):
        """Test invalid login scenarios"""
        print("\n🚫 Testing Invalid Login...")
        
        # Test unauthorized email
        login_data = {
            'email': 'unauthorized@test.com',
            'password': 'CompassX2026!'
        }
        success, data = self.make_request('POST', 'auth/login', login_data, 401)
        self.log_test("Unauthorized Email", success, "Should reject unauthorized user")
        
        # Test wrong password
        login_data = {
            'email': 'brian.clements@compassx.com',
            'password': 'wrongpassword'
        }
        success, data = self.make_request('POST', 'auth/login', login_data, 401)
        self.log_test("Wrong Password", success, "Should reject invalid password")
        
        return True

    def test_auth_me(self):
        """Test getting current user info"""
        success, data = self.make_request('GET', 'auth/me', expect_status=200)
        if success and 'user_id' in data:
            self.log_test("Get Current User", True, f"Name: {data.get('name')}")
            return True
        else:
            self.log_test("Get Current User", False, f"Response: {data}")
            return False

    def test_seed_data(self):
        """Test seeding sample data"""
        print("\n🌱 Testing Data Seeding...")
        success, data = self.make_request('POST', 'seed', expect_status=200)
        self.log_test("Seed Sample Data", success, data.get('message', ''))
        return success

    def test_organizations(self):
        """Test organization endpoints"""
        print("\n🏢 Testing Organizations...")
        
        # Get organizations
        success, data = self.make_request('GET', 'organizations', expect_status=200)
        if success and isinstance(data, list):
            org_count = len(data)
            self.log_test("Get Organizations", True, f"Found {org_count} organizations")
            
            if org_count > 0:
                # Test get single organization
                org_id = data[0]['org_id']
                success, org_data = self.make_request('GET', f'organizations/{org_id}', expect_status=200)
                self.log_test("Get Single Organization", success, f"Org: {org_data.get('name', 'Unknown')}")
                return success
            return True
        else:
            self.log_test("Get Organizations", False, f"Response: {data}")
            return False

    def test_contacts(self):
        """Test contact endpoints"""
        print("\n👥 Testing Contacts...")
        
        # Get contacts
        success, data = self.make_request('GET', 'contacts', expect_status=200)
        if success and isinstance(data, list):
            contact_count = len(data)
            self.log_test("Get Contacts", True, f"Found {contact_count} contacts")
            
            if contact_count > 0:
                # Test get single contact
                contact_id = data[0]['contact_id']
                success, contact_data = self.make_request('GET', f'contacts/{contact_id}', expect_status=200)
                self.log_test("Get Single Contact", success, f"Contact: {contact_data.get('name', 'Unknown')}")
                return success
            return True
        else:
            self.log_test("Get Contacts", False, f"Response: {data}")
            return False

    def test_pipelines_and_stages(self):
        """Test pipeline and stage endpoints"""
        print("\n📊 Testing Pipelines & Stages...")
        
        # Get pipelines
        success, pipelines = self.make_request('GET', 'pipelines', expect_status=200)
        if success and isinstance(pipelines, list) and len(pipelines) > 0:
            self.log_test("Get Pipelines", True, f"Found {len(pipelines)} pipelines")
            
            # Get stages for first pipeline
            pipeline_id = pipelines[0]['pipeline_id']
            success, stages = self.make_request('GET', f'pipelines/{pipeline_id}/stages', expect_status=200)
            if success and isinstance(stages, list):
                self.log_test("Get Pipeline Stages", True, f"Found {len(stages)} stages")
                return success
            else:
                self.log_test("Get Pipeline Stages", False, f"Response: {stages}")
                return False
        else:
            self.log_test("Get Pipelines", False, f"Response: {pipelines}")
            return False

    def test_opportunities(self):
        """Test opportunity endpoints"""
        print("\n💼 Testing Opportunities...")
        
        # Get opportunities
        success, data = self.make_request('GET', 'opportunities', expect_status=200)
        if success and isinstance(data, list):
            opp_count = len(data)
            self.log_test("Get Opportunities", True, f"Found {opp_count} opportunities")
            
            if opp_count > 0:
                # Test get single opportunity
                opp_id = data[0]['opp_id']
                success, opp_data = self.make_request('GET', f'opportunities/{opp_id}', expect_status=200)
                self.log_test("Get Single Opportunity", success, f"Opp: {opp_data.get('name', 'Unknown')}")
                return success
            return True
        else:
            self.log_test("Get Opportunities", False, f"Response: {data}")
            return False

    def test_activities(self):
        """Test activity endpoints"""
        print("\n📅 Testing Activities...")
        
        # Get activities
        success, data = self.make_request('GET', 'activities', expect_status=200)
        if success and isinstance(data, list):
            activity_count = len(data)
            self.log_test("Get Activities", True, f"Found {activity_count} activities")
            return True
        else:
            self.log_test("Get Activities", False, f"Response: {data}")
            return False

    def test_dashboard(self):
        """Test dashboard endpoints"""
        print("\n📈 Testing Dashboard...")
        
        # Test sales dashboard
        success, data = self.make_request('GET', 'dashboard/sales', expect_status=200)
        if success and 'metrics' in data and 'opportunities' in data:
            metrics = data['metrics']
            self.log_test("Sales Dashboard", True, f"Pipeline: ${metrics.get('total_value', 0):,.0f}, {metrics.get('total_opportunities', 0)} deals")
            
            # Test executive dashboard
            success, exec_data = self.make_request('GET', 'dashboard/executive', expect_status=200)
            if success and 'metrics' in exec_data:
                self.log_test("Executive Dashboard", True, f"Total pipeline: ${exec_data['metrics'].get('total_pipeline_value', 0):,.0f}")
                return success
            else:
                self.log_test("Executive Dashboard", False, f"Response: {exec_data}")
                return False
        else:
            self.log_test("Sales Dashboard", False, f"Response: {data}")
            return False

    def test_ai_copilot(self):
        """Test AI Copilot functionality"""
        print("\n🤖 Testing AI Copilot...")
        
        # Get first opportunity for AI testing
        success, opps = self.make_request('GET', 'opportunities', expect_status=200)
        if not success or not opps:
            self.log_test("AI Copilot - No Opportunities", False, "No opportunities found for AI testing")
            return False
        
        opp_id = opps[0]['opp_id']
        
        # Test summarize action
        ai_data = {
            'action': 'summarize',
            'opp_id': opp_id
        }
        success, response = self.make_request('POST', 'ai/copilot', ai_data, expect_status=200)
        if success and 'result' in response:
            result_length = len(response.get('result', ''))
            self.log_test("AI Copilot - Summarize", True, f"Generated {result_length} chars response")
            return True
        else:
            self.log_test("AI Copilot - Summarize", False, f"Response: {response}")
            return False

    def test_analytics(self):
        """Test analytics endpoints"""
        print("\n📊 Testing Analytics...")
        
        # Test pipeline analytics
        success, data = self.make_request('GET', 'analytics/pipeline', expect_status=200)
        if success and isinstance(data, list):
            self.log_test("Pipeline Analytics", True, f"Found {len(data)} stage analytics")
            
            # Test engagement analytics
            success, eng_data = self.make_request('GET', 'analytics/engagement-types', expect_status=200)
            if success and isinstance(eng_data, list):
                self.log_test("Engagement Type Analytics", True, f"Found {len(eng_data)} engagement types")
                return success
            else:
                self.log_test("Engagement Type Analytics", False, f"Response: {eng_data}")
                return False
        else:
            self.log_test("Pipeline Analytics", False, f"Response: {data}")
            return False

    def test_logout(self):
        """Test logout functionality"""
        print("\n🚪 Testing Logout...")
        success, data = self.make_request('POST', 'auth/logout', expect_status=200)
        self.log_test("Logout", success, data.get('message', ''))
        return success

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting CompassX CRM API Test Suite")
        print("=" * 60)
        
        # Core Authentication Tests
        if not self.test_jwt_login():
            print("❌ Authentication failed - stopping tests")
            return False
        
        if not self.test_auth_me():
            print("❌ User verification failed - stopping tests") 
            return False
            
        # Test invalid login scenarios
        self.test_invalid_login()
        
        # Data Setup
        self.test_seed_data()
        
        # Core Business Logic Tests
        backend_tests = [
            self.test_organizations,
            self.test_contacts,
            self.test_pipelines_and_stages,
            self.test_opportunities,
            self.test_activities,
            self.test_dashboard,
            self.test_analytics,
        ]
        
        # Run tests and track failures
        failures = []
        for test_func in backend_tests:
            if not test_func():
                failures.append(test_func.__name__)
        
        # AI Tests (may fail due to LLM key issues)
        try:
            if not self.test_ai_copilot():
                failures.append("AI Copilot")
        except Exception as e:
            self.log_test("AI Copilot", False, f"Exception: {str(e)}")
            failures.append("AI Copilot")
        
        # Logout test
        self.test_logout()
        
        # Print final results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if failures:
            print(f"❌ Failed tests: {', '.join(failures)}")
        
        # Return success if critical tests pass (> 80%)
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        return success_rate > 80

def main():
    """Main test runner"""
    tester = CompassXAPITester()
    
    try:
        success = tester.run_all_tests()
        
        # Save results
        results = {
            "timestamp": datetime.now().isoformat(),
            "total_tests": tester.tests_run,
            "passed_tests": tester.tests_passed,
            "success_rate": (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
            "overall_success": success,
            "test_details": tester.test_results
        }
        
        with open('/tmp/backend_test_results.json', 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\n📁 Detailed results saved to /tmp/backend_test_results.json")
        
        return 0 if success else 1
        
    except Exception as e:
        print(f"💥 Test suite crashed: {str(e)}")
        return 2

if __name__ == "__main__":
    sys.exit(main())