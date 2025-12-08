import requests
import json

def test_endpoints():
    base_url = "http://localhost:8000"
    
    print("Testing FarmWhisper Backend Endpoints")
    print("=" * 40)
    
    # Test 1: Health check
    try:
        response = requests.get(f"{base_url}/health")
        print(f"Health Check: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Health Check: FAILED - {e}")
    
    # Test 2: Test endpoint
    try:
        response = requests.get(f"{base_url}/test")
        print(f"Test Endpoint: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Test Endpoint: FAILED - {e}")
    
    # Test 3: Weather endpoint (expected to fail with simplified backend)
    try:
        response = requests.get(f"{base_url}/weather/location?location=Delhi")
        print(f"Weather Endpoint: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Weather Endpoint: FAILED (Expected with simplified backend) - {e}")
    
    # Test 4: Community posts endpoint (expected to fail with simplified backend)
    try:
        response = requests.get(f"{base_url}/community/")
        print(f"Community Endpoint: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Community Endpoint: FAILED (Expected with simplified backend) - {e}")

if __name__ == "__main__":
    test_endpoints()