from fastapi import APIRouter, HTTPException
from app.models.models import AdvisoryRequest, AdvisoryResponse
from app.services.advice_service import generate_poetic_advice
from app.utils.validation import validate_crop_health_score, validate_pest_risk

router = APIRouter()

@router.post("/story", response_model=AdvisoryResponse, summary="Generate story-based advisory")
async def generate_story_advisory(request: AdvisoryRequest):
    """
    Generate poetic, story-based advisory for farmers based on crop type and analysis result.
    
    - **crop_type**: Type of crop (e.g., wheat, rice, corn)
    - **analysis_result**: Result from crop analysis including health score, pest risk, and issues
    """
    try:
        # Validate crop health score
        if not validate_crop_health_score(request.analysis_result.health_score):
            raise HTTPException(status_code=400, detail="Invalid health score. Must be between 0 and 100.")
        
        # Validate pest risk
        if not validate_pest_risk(request.analysis_result.pest_risk):
            raise HTTPException(status_code=400, detail="Invalid pest risk. Must be 'low', 'medium', or 'high'.")
        
        # Generate poetic advisory
        advisory_response = generate_poetic_advice(request.crop_type, request.analysis_result)
        
        return advisory_response
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Advisory generation failed: {str(e)}")