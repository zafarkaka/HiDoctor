import requests
import sys
from datetime import datetime
import uuid

class HealthcareAPITester:
    def __init__(self, base_url="https://docpatient-staging.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=True):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                return True, response.json() if response.content else {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.content:
                    try:
                        error_data = response.json()
                        print(f"   Error: {error_data}")
                    except:
                        print(f"   Response: {response.text}")
                self.failed_tests.append(f"{name} - Expected {expected_status}, got {response.status_code}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append(f"{name} - Exception: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        return self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200,
            auth_required=False
        )

    def test_get_specialties(self):
        """Test specialties endpoint"""
        return self.run_test(
            "Get Specialties",
            "GET", 
            "api/specialties",
            200,
            auth_required=False
        )

    def test_get_doctors(self):
        """Test get doctors endpoint"""
        return self.run_test(
            "Get Doctors List",
            "GET",
            "api/doctors",
            200,
            auth_required=False
        )

    def test_user_registration(self):
        """Test user registration"""
        test_email = f"test_patient_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com"
        success, response = self.run_test(
            "User Registration - Patient",
            "POST",
            "api/auth/register",
            200,
            data={
                "email": test_email,
                "password": "testpass123",
                "full_name": "Test Patient User",
                "phone": "+1234567890",
                "role": "patient"
            },
            auth_required=False
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   Registered user: {test_email}")
            return True
        return False

    def test_user_login(self):
        """Test user login with demo account"""
        success, response = self.run_test(
            "User Login - Demo Patient",
            "POST",
            "api/auth/login",
            200,
            data={
                "email": "patient@demo.com",
                "password": "demo123"
            },
            auth_required=False
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_get_current_user(self):
        """Test get current user profile"""
        return self.run_test(
            "Get Current User Profile",
            "GET",
            "api/auth/me",
            200
        )

    def test_patient_profile(self):
        """Test patient profile operations"""
        # Get profile
        get_success, _ = self.run_test(
            "Get Patient Profile",
            "GET",
            "api/patients/profile",
            200
        )
        
        # Update profile
        update_success, _ = self.run_test(
            "Update Patient Profile",
            "PUT",
            "api/patients/profile",
            200,
            data={
                "date_of_birth": "1990-01-01",
                "gender": "male",
                "preferred_language": "English"
            }
        )
        
        return get_success and update_success

    def test_family_members(self):
        """Test family members CRUD operations"""
        # Get family members
        get_success, _ = self.run_test(
            "Get Family Members",
            "GET",
            "api/family-members",
            200
        )
        
        # Add family member
        add_success, add_response = self.run_test(
            "Add Family Member",
            "POST",
            "api/family-members",
            200,
            data={
                "full_name": "Test Child",
                "date_of_birth": "2015-06-15",
                "gender": "female",
                "relationship": "child"
            }
        )
        
        return get_success and add_success

    def test_appointments(self):
        """Test appointment operations"""
        # Get appointments
        get_success, _ = self.run_test(
            "Get User Appointments",
            "GET",
            "api/appointments",
            200
        )
        
        return get_success

    def test_notifications(self):
        """Test notifications"""
        return self.run_test(
            "Get Notifications",
            "GET",
            "api/notifications",
            200
        )

    def print_summary(self):
        """Print test results summary"""
        print(f"\n{'='*50}")
        print(f"📊 TEST SUMMARY")
        print(f"{'='*50}")
        print(f"✅ Tests passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Tests failed: {len(self.failed_tests)}")
        
        if self.failed_tests:
            print(f"\n🚨 FAILED TESTS:")
            for failed_test in self.failed_tests:
                print(f"   - {failed_test}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n📈 Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test runner"""
    print("🏥 Healthcare Platform API Testing")
    print("=" * 40)
    
    tester = HealthcareAPITester()
    
    # Test sequence
    tests = [
        ("Health Check", tester.test_health_check),
        ("Specialties Endpoint", tester.test_get_specialties),
        ("Doctors Endpoint", tester.test_get_doctors),
        ("User Registration", tester.test_user_registration),
        ("Patient Profile", tester.test_patient_profile),
        ("Family Members", tester.test_family_members),
        ("Appointments", tester.test_appointments),
        ("Notifications", tester.test_notifications)
    ]
    
    # Run tests
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            tester.failed_tests.append(f"{test_name} - Exception: {str(e)}")
    
    # Print summary
    all_passed = tester.print_summary()
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())