from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import os
import tempfile
from app.models.models import VoiceQueryResponse
from app.services.voice_service import process_voice_query
from app.utils.validation import validate_audio_file, validate_file_size

router = APIRouter()

@router.post("/query", response_model=VoiceQueryResponse, summary="Process voice query")
async def process_voice_query_endpoint(
    audio_file: UploadFile = File(...),
    method: str = Form("google"),
    language_preference: Optional[str] = Form(None)
):
    """
    Process voice query from audio file and return transcribed text.
    
    - **audio_file**: Audio file containing the voice query
    - **method**: Recognition method ("google" or "vosk")
    - **language_preference**: Preferred language for recognition
    """
    try:
        # Validate file type
        if not audio_file.content_type.startswith("audio/"):
            raise HTTPException(status_code=400, detail="Invalid file type. Please upload an audio file.")
        
        # Validate file extension
        if not validate_audio_file(audio_file.filename):
            raise HTTPException(status_code=400, detail="Unsupported audio file format. Please use WAV, MP3, or OGG.")
        
        # Validate file size (max 10MB)
        file_size = 0
        if hasattr(audio_file, 'size'):
            file_size = audio_file.size
        else:
            # For streaming uploads, we'll check after saving
            pass
            
        # Save uploaded file temporarily
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(audio_file.filename)[1])
        content = await audio_file.read()
        
        # Check file size after reading
        if not file_size:
            file_size = len(content)
            
        if not validate_file_size(file_size):
            os.unlink(temp_file.name)
            raise HTTPException(status_code=400, detail="File size exceeds 10MB limit.")
        
        temp_file.write(content)
        temp_file.close()
        
        # Process voice query
        text, language = process_voice_query(temp_file.name, method)
        
        # Clean up temporary file
        os.unlink(temp_file.name)
        
        return VoiceQueryResponse(text=text, language=language)
    
    except HTTPException:
        raise
    except Exception as e:
        # Clean up temporary file if it exists
        try:
            if 'temp_file' in locals():
                os.unlink(temp_file.name)
        except:
            pass
        raise HTTPException(status_code=500, detail=f"Voice processing failed: {str(e)}")