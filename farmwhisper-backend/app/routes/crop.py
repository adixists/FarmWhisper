from fastapi import APIRouter, UploadFile, File, HTTPException
import os
import tempfile
from app.models.models import CropAnalysisResponse
from app.services.crop_service import analyze_crop_health
from app.utils.validation import validate_image_file, validate_file_size

router = APIRouter()

@router.post("/analyze", response_model=CropAnalysisResponse, summary="Analyze crop health from image")
async def analyze_crop(image: UploadFile = File(...)):
    """
    Analyze crop health from an uploaded image file.
    
    - **image**: Image file of the crop to analyze
    """
    try:
        # Validate file type
        if not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image file.")
        
        # Validate file extension
        if not validate_image_file(image.filename):
            raise HTTPException(status_code=400, detail="Unsupported image format. Please use JPG, PNG, or GIF.")
        
        # Validate file size (max 10MB)
        file_size = 0
        if hasattr(image, 'size'):
            file_size = image.size
        else:
            # For streaming uploads, we'll check after saving
            pass
        
        # Save uploaded file temporarily
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(image.filename)[1])
        content = await image.read()
        
        # Check file size after reading
        if not file_size:
            file_size = len(content)
            
        if not validate_file_size(file_size):
            os.unlink(temp_file.name)
            raise HTTPException(status_code=400, detail="File size exceeds 10MB limit.")
        
        temp_file.write(content)
        temp_file.close()
        
        # Analyze crop health
        analysis_result = analyze_crop_health(temp_file.name)
        
        # Clean up temporary file
        os.unlink(temp_file.name)
        
        return analysis_result
    
    except HTTPException:
        raise
    except Exception as e:
        # Clean up temporary file if it exists
        try:
            if 'temp_file' in locals():
                os.unlink(temp_file.name)
        except:
            pass
        raise HTTPException(status_code=500, detail=f"Crop analysis failed: {str(e)}")