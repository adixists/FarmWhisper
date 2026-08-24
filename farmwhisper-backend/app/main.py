import os
import tempfile
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import Optional, List, Dict, Any
from app.services.vision_service import VisionService
from app.services.weather_service import (
    get_weather_data, 
    get_weather_by_location, 
    get_multiday_forecast
)
from app.services.voice_service import (
    process_voice_query, 
    answer_agricultural_query
)

app = FastAPI(
    title="FarmWhisper - AI Voice & Vision Assistant for Farmers",
    description="Backend API for FarmWhisper mobile application",
    version="1.0.0"
)

# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for demo and session history
uploaded_images = {}
uploaded_audios = {}
scanned_crops_history: List[Dict[str, Any]] = []

@app.get("/")
async def root():
    return {"message": "Welcome to FarmWhisper Backend API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/test")
async def test_endpoint():
    return {"message": "Test endpoint working!"}

# Voice processing & AI reasoning endpoint
@app.post("/voice/query")
async def handle_voice_query(
    audio_file: Optional[UploadFile] = File(None),
    text_query: Optional[str] = Form(None),
    lat: Optional[float] = Form(None),
    lon: Optional[float] = Form(None),
    language: Optional[str] = Form("hi")
):
    """
    Process voice query from audio file or text query.
    Extracts weather context and crop history to generate a bilingual conversational answer.
    """
    try:
        user_text = text_query
        detected_lang = language or "hi"
        
        # 1. If audio file is uploaded, perform STT
        if audio_file:
            content = await audio_file.read()
            uploaded_audios[audio_file.filename] = content
            
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                tmp.write(content)
                tmp_path = tmp.name
                
            try:
                user_text, detected_lang = process_voice_query(tmp_path)
            finally:
                if os.path.exists(tmp_path):
                    try:
                        os.unlink(tmp_path)
                    except Exception:
                        pass
                        
        if not user_text or user_text.strip() == "":
            return {
                "query": "",
                "response_text": "नमस्ते किसान भाई! मैं फार्मव्हिस्पर हूँ। बोलिए, मैं मौसम और फसल में आपकी क्या मदद कर सकता हूँ?",
                "language": "hi",
                "query_type": "general",
                "recommendations": ["पूछें: आज का मौसम कैसा रहेगा?", "पूछें: कल बारिश होगी क्या?"]
            }

        # 2. Gather live context (Weather + Multiday Forecast)
        weather_ctx = None
        if lat is not None and lon is not None:
            try:
                weather_ctx = get_multiday_forecast(lat, lon, days=4)
            except Exception as e:
                print(f"Failed to gather weather context: {e}")
        else:
            try:
                weather_ctx = get_multiday_forecast(28.6139, 77.2090, days=4)
            except Exception:
                pass

        # 3. Call Bilingual Gemini NLP
        ai_response = answer_agricultural_query(
            user_query=user_text,
            language_hint=detected_lang,
            weather_context=weather_ctx,
            crop_history=scanned_crops_history
        )
        
        # Attach 3-day forecast if user inquired about weather
        if ai_response.get("query_type") == "weather" and weather_ctx:
            ai_response["weather_data"] = weather_ctx
            
        return ai_response
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Voice processing failed: {str(e)}")

# Crop analysis endpoint
@app.post("/crop/analyze")
async def analyze_crop(image: UploadFile = File(...)):
    """
    Analyze crop health from an uploaded image file using the VisionService Pipeline.
    """
    try:
        content = await image.read()
        uploaded_images[image.filename] = content
        
        # Process the image using the strict vision pipeline service
        analysis_result = VisionService.analyze_crop_image(content)
        
        # Save to session history so voice queries can refer to it
        res_dict = analysis_result.dict() if hasattr(analysis_result, 'dict') else analysis_result
        scanned_crops_history.append(res_dict)
        if len(scanned_crops_history) > 10:
            scanned_crops_history.pop(0)
        
        # Return the Pydantic model directly
        return analysis_result
            
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Crop analysis failed: {str(e)}")

@app.get("/crop/history")
async def get_crop_history():
    """
    Get recent scanned crops and diagnoses.
    """
    return scanned_crops_history

# Story-based advisory endpoint
@app.post("/advice/story")
async def generate_story_advisory(request: dict):
    """
    Generate poetic, story-based advisory for farmers.
    """
    try:
        crop_type = request.get("crop_type", "crop")
        return {
            "story": f"The soil hums of thirst — calling for the old river's memory. Like a wise grandmother, your {crop_type} whispers of balance - neither too much nor too little. The golden sun smiles upon your fields, promising abundance to those who listen to nature's rhythm.",
            "tips": [
                "Water your crops in the early morning",
                "Apply organic compost",
                "Monitor for pests regularly"
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Advisory generation failed: {str(e)}")

# Weather endpoints
@app.get("/weather/forecast")
async def get_weather_forecast(lat: float, lon: float):
    """
    Get live weather forecast for a specific location using latitude and longitude.
    """
    try:
        weather_res = get_weather_data(lat, lon)
        return weather_res.dict() if hasattr(weather_res, 'dict') else weather_res
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Weather data retrieval failed: {str(e)}")

@app.get("/weather/forecast/multiday")
async def get_multiday_weather_endpoint(lat: float, lon: float, days: int = 4):
    """
    Get live 3-day and 4-day daily weather forecast with rain probability % and temps.
    """
    try:
        forecast_data = get_multiday_forecast(lat, lon, days=days)
        return forecast_data
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Multiday weather retrieval failed: {str(e)}")

@app.get("/weather/location")
async def get_weather_by_location_endpoint(location: str):
    """
    Get live weather forecast for a specific location by city/town name.
    """
    try:
        weather_res = get_weather_by_location(location)
        return weather_res.dict() if hasattr(weather_res, 'dict') else weather_res
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Weather data retrieval failed: {str(e)}")

# Community endpoints
@app.get("/community/")
async def list_community_posts(limit: int = 10, offset: int = 0):
    try:
        mock_posts = [
            {
                "id": "1",
                "user_id": "user1",
                "title": "Traditional Rain Prediction Method",
                "content": "My grandmother always said: when peacocks dance and frogs croak loudly, rain is coming in 24 hours. This has helped me plan my farming activities for decades!",
                "upvotes": 42,
                "created_at": "2025-11-27T10:30:00Z",
                "tags": ["traditional knowledge", "weather prediction"]
            },
            {
                "id": "2",
                "user_id": "user2",
                "title": "Natural Pest Control",
                "content": "Neem oil spray works wonders! Mix 2 tablespoons of neem oil with 1 liter of water and a few drops of dish soap. Spray on plants in the evening to avoid burning leaves.",
                "upvotes": 38,
                "created_at": "2025-11-26T14:15:00Z",
                "tags": ["pest control", "organic farming"]
            },
            {
                "id": "3",
                "user_id": "user3",
                "title": "Soil Health Improvement",
                "content": "Cow dung + wood ash + water = excellent fertilizer. Let it sit for a week, then dilute 1:10 before applying to crops. My wheat yield increased by 30% last season!",
                "upvotes": 56,
                "created_at": "2025-11-25T09:45:00Z",
                "tags": ["soil health", "fertilizer"]
            }
        ]
        start = offset
        end = offset + limit
        return mock_posts[start:end]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve posts: {str(e)}")

@app.post("/community/")
async def create_community_post(post: dict):
    try:
        post["id"] = "new-post-id"
        post["upvotes"] = 0
        post["created_at"] = "2025-11-27T12:00:00Z"
        return post
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create post: {str(e)}")

@app.post("/community/upvote")
async def upvote_community_post(request: dict):
    try:
        post_id = request.get("post_id")
        return {
            "message": "Post upvoted successfully",
            "upvotes": 43
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upvote post: {str(e)}")