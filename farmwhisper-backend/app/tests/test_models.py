import pytest
from app.models.models import (
    User, UserRole, Token, VoiceQueryResponse, 
    CropHealthAnalysis, AdvisoryResponse, WeatherResponse,
    CommunityPost, CommunityPostCreate, UpvoteRequest
)

def test_user_model():
    """Test User model creation"""
    user = User(
        phone_number="+1234567890",
        name="Test User",
        role=UserRole.farmer
    )
    
    assert user.phone_number == "+1234567890"
    assert user.name == "Test User"
    assert user.role == UserRole.farmer

def test_crop_health_analysis_model():
    """Test CropHealthAnalysis model"""
    analysis = CropHealthAnalysis(
        health_score=85,
        pest_risk="low",
        issues=["minor discoloration"],
        recommendations=["monitor regularly"]
    )
    
    assert analysis.health_score == 85
    assert analysis.pest_risk == "low"
    assert "minor discoloration" in analysis.issues
    assert "monitor regularly" in analysis.recommendations

def test_advisory_response_model():
    """Test AdvisoryResponse model"""
    advisory = AdvisoryResponse(
        story="The plants whisper of balanced soil and gentle rains.",
        tips=["water regularly", "check for pests"]
    )
    
    assert "whisper" in advisory.story
    assert len(advisory.tips) == 2

def test_weather_response_model():
    """Test WeatherResponse model"""
    weather = WeatherResponse(
        temperature=25.5,
        humidity=60.0,
        rain_probability=20.0,
        description="Partly cloudy",
        location="Test City, TC"
    )
    
    assert weather.temperature == 25.5
    assert weather.humidity == 60.0
    assert weather.rain_probability == 20.0
    assert weather.description == "Partly cloudy"
    assert weather.location == "Test City, TC"

def test_community_post_model():
    """Test CommunityPost model"""
    post = CommunityPost(
        user_id="user123",
        title="Test Post",
        content="This is a test post content.",
        tags=["test", "community"]
    )
    
    assert post.user_id == "user123"
    assert post.title == "Test Post"
    assert post.content == "This is a test post content."
    assert "test" in post.tags
    assert post.upvotes == 0  # Default value