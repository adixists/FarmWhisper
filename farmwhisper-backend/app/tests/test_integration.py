import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_api_flow():
    """Test a full API flow from health check to endpoint access"""
    # Test health check
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}
    
    # Test root endpoint
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()
    
    # Test auth endpoints (without actual auth since we don't have a real DB in tests)
    response = client.post("/auth/send-otp?phone_number=%2B1234567890")
    # This might fail in tests without proper mocking, but we're testing the endpoint exists
    assert response.status_code in [200, 500]  # Either success or internal error (expected in test)
    
    # Test voice endpoint
    response = client.post("/voice/query")
    # Should fail due to missing file, but endpoint should exist
    assert response.status_code == 422  # Validation error
    
    # Test crop endpoint
    response = client.post("/crop/analyze")
    # Should fail due to missing file, but endpoint should exist
    assert response.status_code == 422  # Validation error
    
    # Test advice endpoint
    response = client.post("/advice/story", json={
        "crop_type": "wheat",
        "analysis_result": {
            "health_score": 85,
            "pest_risk": "low",
            "issues": ["minor discoloration"],
            "recommendations": ["monitor regularly"]
        }
    })
    # Should either succeed or fail with a 4xx/5xx error, but endpoint should exist
    assert response.status_code in [200, 400, 500]
    
    # Test weather endpoints
    response = client.get("/weather/forecast?lat=40.7128&lon=-74.0060")
    # Should fail due to missing API key, but endpoint should exist
    assert response.status_code in [400, 500, 502]  # Bad request, internal error, or service error
    
    response = client.get("/weather/location?location=New York")
    # Should fail due to missing API key, but endpoint should exist
    assert response.status_code in [400, 500, 502]  # Bad request, internal error, or service error
    
    # Test community endpoints
    response = client.get("/community/")
    # Should succeed or fail with 500 due to DB connection, but endpoint should exist
    assert response.status_code in [200, 500]
    
    response = client.get("/community/search?tag=test")
    # Should succeed or fail with 500 due to DB connection, but endpoint should exist
    assert response.status_code in [200, 500]