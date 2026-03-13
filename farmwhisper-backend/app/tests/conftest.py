import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client():
    """Create a test client for the FastAPI app"""
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture(scope="module")
def sample_user_data():
    """Sample user data for testing"""
    return {
        "phone_number": "+1234567890",
        "name": "Test User"
    }

@pytest.fixture(scope="module")
def sample_crop_analysis():
    """Sample crop analysis data for testing"""
    return {
        "health_score": 85,
        "pest_risk": "low",
        "issues": ["minor discoloration"],
        "recommendations": ["monitor regularly"]
    }

@pytest.fixture(scope="module")
def sample_weather_data():
    """Sample weather data for testing"""
    return {
        "temperature": 25.5,
        "humidity": 60.0,
        "rain_probability": 20.0,
        "description": "Partly cloudy",
        "location": "Test City, TC"
    }