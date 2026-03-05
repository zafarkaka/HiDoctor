"""
Healthcare Booking Platform API Tests
Testing: Authentication, Doctors, Appointments, Reviews, Razorpay Payments (Mock)
"""
import pytest
import requests
import os
import time
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from requirements
PATIENT_CREDS = {"email": "patient@demo.com", "password": "patient123"}
DOCTOR_CREDS = {"email": "doctor@demo.com", "password": "doctor123"}
ADMIN_CREDS = {"email": "admin@demo.com", "password": "admin123"}

# Storage for test data across tests
test_data = {}


class TestHealthCheck:
    """Health check endpoint - run first"""
    
    def test_health_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        data = response.json()
        assert data.get("status") == "healthy"
        print("✓ Health check passed")


class TestPatientAuthentication:
    """Patient login with demo credentials"""
    
    def test_patient_login_success(self):
        """Test patient login with patient@demo.com/patient123"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=PATIENT_CREDS)
        
        if response.status_code == 401:
            # Patient doesn't exist, create it first
            print("Patient user doesn't exist, creating...")
            create_response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": PATIENT_CREDS["email"],
                "password": PATIENT_CREDS["password"],
                "full_name": "Demo Patient",
                "role": "patient"
            })
            if create_response.status_code == 400:
                # Email already registered but wrong password, try login again
                pass
            else:
                assert create_response.status_code == 200, f"Failed to create patient: {create_response.text}"
            
            # Try login again
            response = requests.post(f"{BASE_URL}/api/auth/login", json=PATIENT_CREDS)
        
        assert response.status_code == 200, f"Patient login failed: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "access_token" in data, "Missing access_token in response"
        assert "user" in data, "Missing user in response"
        assert data["user"]["email"] == PATIENT_CREDS["email"]
        assert data["user"]["role"] == "patient"
        
        # Store token for other tests
        test_data["patient_token"] = data["access_token"]
        test_data["patient_id"] = data["user"]["id"]
        print(f"✓ Patient login successful - ID: {test_data['patient_id']}")
    
    def test_patient_auth_me(self):
        """Verify patient token works with /auth/me"""
        token = test_data.get("patient_token")
        if not token:
            pytest.skip("No patient token available")
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        
        assert response.status_code == 200, f"Auth/me failed: {response.text}"
        data = response.json()
        assert data["email"] == PATIENT_CREDS["email"]
        print("✓ Patient auth/me verification passed")


class TestDoctorAuthentication:
    """Doctor login with demo credentials"""
    
    def test_doctor_login_success(self):
        """Test doctor login with doctor@demo.com/doctor123"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=DOCTOR_CREDS)
        
        if response.status_code == 401:
            # Doctor doesn't exist, create it first
            print("Doctor user doesn't exist, creating...")
            create_response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": DOCTOR_CREDS["email"],
                "password": DOCTOR_CREDS["password"],
                "full_name": "Demo Doctor",
                "role": "doctor"
            })
            
            if create_response.status_code == 200:
                data = create_response.json()
                test_data["doctor_token"] = data["access_token"]
                test_data["doctor_id"] = data["user"]["id"]
                
                # Create doctor profile
                headers = {"Authorization": f"Bearer {test_data['doctor_token']}"}
                profile_response = requests.post(f"{BASE_URL}/api/doctors/profile", headers=headers, json={
                    "license_number": "DOC123456",
                    "specialties": ["General Medicine"],
                    "years_experience": 10,
                    "consultation_fee": 100.0,
                    "qualifications": ["MBBS", "MD"],
                    "languages": ["English", "Hindi"]
                })
                print(f"Doctor profile creation: {profile_response.status_code}")
            
            # Try login again
            response = requests.post(f"{BASE_URL}/api/auth/login", json=DOCTOR_CREDS)
        
        assert response.status_code == 200, f"Doctor login failed: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "access_token" in data, "Missing access_token"
        assert data["user"]["role"] == "doctor"
        
        test_data["doctor_token"] = data["access_token"]
        test_data["doctor_id"] = data["user"]["id"]
        print(f"✓ Doctor login successful - ID: {test_data['doctor_id']}")


class TestDoctorsList:
    """Test doctors list API"""
    
    def test_get_doctors_list(self):
        """Get doctors list - public endpoint"""
        response = requests.get(f"{BASE_URL}/api/doctors")
        
        assert response.status_code == 200, f"Get doctors failed: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "doctors" in data, "Missing doctors array"
        assert "total" in data, "Missing total count"
        assert "page" in data, "Missing page number"
        
        print(f"✓ Doctors list retrieved - Total: {data['total']}, Page: {data['page']}")
        print(f"  Found {len(data['doctors'])} doctors in current page")
        
        if data['doctors']:
            test_data["first_doctor_id"] = data['doctors'][0].get("user_id")
    
    def test_get_doctors_with_filters(self):
        """Test doctors list with filters"""
        response = requests.get(f"{BASE_URL}/api/doctors", params={
            "specialty": "General Medicine",
            "page": 1,
            "limit": 10
        })
        
        assert response.status_code == 200, f"Get doctors with filters failed: {response.text}"
        data = response.json()
        assert "doctors" in data
        print(f"✓ Doctors filter by specialty works - Found: {len(data['doctors'])}")


class TestDoctorAvailability:
    """Test doctor availability endpoints"""
    
    def test_get_doctor_availability(self):
        """Get availability for a doctor"""
        doctor_id = test_data.get("doctor_id") or test_data.get("first_doctor_id")
        if not doctor_id:
            pytest.skip("No doctor ID available")
        
        # Get availability for next 7 days
        today = datetime.now().strftime("%Y-%m-%d")
        next_week = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        
        response = requests.get(
            f"{BASE_URL}/api/doctors/{doctor_id}/availability",
            params={"start_date": today, "end_date": next_week}
        )
        
        assert response.status_code == 200, f"Get availability failed: {response.text}"
        data = response.json()
        assert "availability" in data
        print(f"✓ Doctor availability retrieved - {len(data['availability'])} days")
    
    def test_get_available_slots(self):
        """Get available time slots for specific date"""
        doctor_id = test_data.get("doctor_id") or test_data.get("first_doctor_id")
        if not doctor_id:
            pytest.skip("No doctor ID available")
        
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        response = requests.get(
            f"{BASE_URL}/api/doctors/{doctor_id}/available-slots",
            params={"date": tomorrow}
        )
        
        assert response.status_code == 200, f"Get slots failed: {response.text}"
        data = response.json()
        assert "slots" in data
        print(f"✓ Available slots retrieved - {len(data.get('slots', []))} slots for {tomorrow}")


class TestCreateAppointment:
    """Test appointment creation API"""
    
    def test_create_appointment(self):
        """Create appointment as patient"""
        patient_token = test_data.get("patient_token")
        doctor_id = test_data.get("doctor_id") or test_data.get("first_doctor_id")
        
        if not patient_token:
            pytest.skip("No patient token available")
        if not doctor_id:
            pytest.skip("No doctor ID available")
        
        headers = {"Authorization": f"Bearer {patient_token}"}
        
        # Schedule for tomorrow
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        appointment_data = {
            "doctor_id": doctor_id,
            "consultation_type": "in_person",
            "appointment_date": tomorrow,
            "appointment_time": "10:00",
            "reason": "TEST_General checkup for testing"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/appointments",
            headers=headers,
            json=appointment_data
        )
        
        assert response.status_code == 200, f"Create appointment failed: {response.text}"
        data = response.json()
        
        # Validate response
        assert "appointment" in data, "Missing appointment in response"
        appointment = data["appointment"]
        assert "id" in appointment, "Missing appointment ID"
        assert appointment["doctor_id"] == doctor_id
        assert appointment["status"] == "pending"
        assert appointment["payment_status"] == "pending"
        
        test_data["appointment_id"] = appointment["id"]
        test_data["appointment_payment_amount"] = appointment.get("payment_amount", 0)
        print(f"✓ Appointment created - ID: {appointment['id']}")
        print(f"  Payment amount: {appointment.get('payment_amount', 0)}")


class TestRazorpayMockPayment:
    """Test Razorpay payment flow in MOCK mode"""
    
    def test_create_razorpay_order_mock(self):
        """Create Razorpay order - should return mock order in test mode"""
        patient_token = test_data.get("patient_token")
        appointment_id = test_data.get("appointment_id")
        
        if not patient_token:
            pytest.skip("No patient token available")
        if not appointment_id:
            pytest.skip("No appointment ID available")
        
        headers = {"Authorization": f"Bearer {patient_token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/payments/razorpay/create-order",
            headers=headers,
            json={"appointment_id": appointment_id}
        )
        
        assert response.status_code == 200, f"Create Razorpay order failed: {response.text}"
        data = response.json()
        
        # Validate mock response
        assert "order_id" in data, "Missing order_id"
        assert "amount" in data, "Missing amount"
        assert "currency" in data, "Missing currency"
        
        # In mock mode, order_id should start with "order_mock_"
        order_id = data["order_id"]
        is_mock = data.get("is_mock", False) or order_id.startswith("order_mock_")
        
        print(f"✓ Razorpay order created - Order ID: {order_id}")
        print(f"  Amount: {data['amount']} {data['currency']}")
        print(f"  Mock Mode: {is_mock}")
        
        test_data["razorpay_order_id"] = order_id
        test_data["razorpay_is_mock"] = is_mock
        
        # Store for verification test
        assert data["amount"] > 0, "Amount should be greater than 0"
    
    def test_verify_razorpay_payment_mock(self):
        """Verify Razorpay payment - mock mode auto-verifies"""
        patient_token = test_data.get("patient_token")
        order_id = test_data.get("razorpay_order_id")
        
        if not patient_token:
            pytest.skip("No patient token available")
        if not order_id:
            pytest.skip("No Razorpay order ID available")
        
        headers = {"Authorization": f"Bearer {patient_token}"}
        
        # In mock mode, any payment_id and signature work
        verify_data = {
            "razorpay_order_id": order_id,
            "razorpay_payment_id": f"pay_mock_{int(time.time())}",
            "razorpay_signature": "mock_signature_12345"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/payments/razorpay/verify",
            headers=headers,
            json=verify_data
        )
        
        assert response.status_code == 200, f"Verify payment failed: {response.text}"
        data = response.json()
        
        assert data.get("status") == "success", f"Payment verification failed: {data}"
        
        is_mock = data.get("is_mock", False)
        print(f"✓ Razorpay payment verified - Status: {data['status']}")
        print(f"  Mock Mode: {is_mock}")
        print(f"  Message: {data.get('message', 'N/A')}")
    
    def test_get_razorpay_payment_status(self):
        """Get Razorpay payment status after verification"""
        patient_token = test_data.get("patient_token")
        order_id = test_data.get("razorpay_order_id")
        
        if not patient_token:
            pytest.skip("No patient token available")
        if not order_id:
            pytest.skip("No Razorpay order ID available")
        
        headers = {"Authorization": f"Bearer {patient_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/payments/razorpay/status/{order_id}",
            headers=headers
        )
        
        assert response.status_code == 200, f"Get payment status failed: {response.text}"
        data = response.json()
        
        assert data["order_id"] == order_id
        assert data["payment_status"] == "paid", f"Expected 'paid' status, got: {data['payment_status']}"
        
        print(f"✓ Payment status retrieved - Status: {data['payment_status']}")
        print(f"  Amount: {data.get('amount', 0)}")


class TestAppointmentsList:
    """Test appointments list after payment"""
    
    def test_get_patient_appointments(self):
        """Get appointments list for patient"""
        patient_token = test_data.get("patient_token")
        
        if not patient_token:
            pytest.skip("No patient token available")
        
        headers = {"Authorization": f"Bearer {patient_token}"}
        
        response = requests.get(f"{BASE_URL}/api/appointments", headers=headers)
        
        assert response.status_code == 200, f"Get appointments failed: {response.text}"
        data = response.json()
        
        assert "appointments" in data, "Missing appointments array"
        
        print(f"✓ Appointments list retrieved - Count: {len(data['appointments'])}")
        
        # Check if our test appointment is there and has updated status
        appointment_id = test_data.get("appointment_id")
        if appointment_id:
            test_apt = next((a for a in data["appointments"] if a["id"] == appointment_id), None)
            if test_apt:
                print(f"  Test appointment status: {test_apt['status']}")
                print(f"  Test appointment payment_status: {test_apt['payment_status']}")
                # After payment verification, status should be confirmed
                if test_apt["payment_status"] == "paid":
                    assert test_apt["status"] == "confirmed", "Appointment should be confirmed after payment"


class TestReviewsAPI:
    """Test reviews API with rating"""
    
    def test_create_review(self):
        """Create a review for a doctor"""
        patient_token = test_data.get("patient_token")
        doctor_id = test_data.get("doctor_id") or test_data.get("first_doctor_id")
        appointment_id = test_data.get("appointment_id")
        
        if not patient_token:
            pytest.skip("No patient token available")
        if not doctor_id:
            pytest.skip("No doctor ID available")
        if not appointment_id:
            pytest.skip("No appointment ID available")
        
        headers = {"Authorization": f"Bearer {patient_token}"}
        
        review_data = {
            "doctor_id": doctor_id,
            "appointment_id": appointment_id,
            "rating": 5,
            "comment": "TEST_Excellent doctor, very professional and thorough."
        }
        
        response = requests.post(
            f"{BASE_URL}/api/reviews",
            headers=headers,
            json=review_data
        )
        
        # Could be 200 (success) or 400 (already reviewed)
        if response.status_code == 400 and "already exists" in response.text.lower():
            print("✓ Review already exists for this appointment (expected)")
            return
        
        assert response.status_code == 200, f"Create review failed: {response.text}"
        data = response.json()
        
        assert "review" in data, "Missing review in response"
        review = data["review"]
        assert review["rating"] == 5
        assert review["doctor_id"] == doctor_id
        
        test_data["review_id"] = review["id"]
        print(f"✓ Review created - ID: {review['id']}, Rating: {review['rating']}")
    
    def test_get_doctor_reviews(self):
        """Get reviews for a doctor"""
        doctor_id = test_data.get("doctor_id") or test_data.get("first_doctor_id")
        
        if not doctor_id:
            pytest.skip("No doctor ID available")
        
        response = requests.get(f"{BASE_URL}/api/doctors/{doctor_id}/reviews")
        
        assert response.status_code == 200, f"Get reviews failed: {response.text}"
        data = response.json()
        
        assert "reviews" in data, "Missing reviews array"
        assert "total" in data, "Missing total count"
        
        print(f"✓ Doctor reviews retrieved - Total: {data['total']}")
        if data["reviews"]:
            print(f"  First review rating: {data['reviews'][0].get('rating', 'N/A')}")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_appointment(self):
        """Cancel/cleanup test appointment"""
        patient_token = test_data.get("patient_token")
        appointment_id = test_data.get("appointment_id")
        
        if not patient_token or not appointment_id:
            pytest.skip("No test data to cleanup")
        
        headers = {"Authorization": f"Bearer {patient_token}"}
        
        # Try to cancel the appointment (may fail if already completed/cancelled)
        response = requests.post(
            f"{BASE_URL}/api/appointments/{appointment_id}/cancel",
            headers=headers
        )
        
        # 200 = cancelled, 400 = already cancelled/completed
        if response.status_code == 200:
            print(f"✓ Test appointment cancelled: {appointment_id}")
        else:
            print(f"✓ Test appointment cleanup skipped (status: {response.status_code})")


# Run configuration for pytest
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
