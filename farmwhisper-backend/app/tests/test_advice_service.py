import pytest
from app.models.models import CropHealthAnalysis
from app.services.advice_service import generate_poetic_advice, generate_fallback_advice

def test_generate_fallback_advice():
    """Test fallback advice generation"""
    # Create a sample crop health analysis
    analysis = CropHealthAnalysis(
        health_score=75,
        pest_risk="medium",
        issues=["yellow leaves"],
        recommendations=["apply nitrogen fertilizer"]
    )
    
    # Generate fallback advice
    advice = generate_fallback_advice("wheat", analysis)
    
    # Check that advice is generated
    assert isinstance(advice, str)
    assert len(advice) > 0
    assert "wheat" in advice.lower()

def test_generate_poetic_advice():
    """Test poetic advice generation"""
    # Create a sample crop health analysis
    analysis = CropHealthAnalysis(
        health_score=75,
        pest_risk="medium",
        issues=["yellow leaves"],
        recommendations=["apply nitrogen fertilizer"]
    )
    
    # Generate poetic advice
    response = generate_poetic_advice("wheat", analysis)
    
    # Check that response is generated
    assert isinstance(response.story, str)
    assert isinstance(response.tips, list)
    assert len(response.story) > 0
    assert len(response.tips) > 0