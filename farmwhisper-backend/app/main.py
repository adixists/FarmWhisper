from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import Optional
import io
import base64
import json

app = FastAPI(
    title="FarmWhisper - AI Voice & Vision Assistant for Farmers",
    description="Backend API for FarmWhisper mobile application",
    version="1.0.0"
)

# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for demo purposes
uploaded_images = {}
uploaded_audios = {}

@app.get("/")
async def root():
    return {"message": "Welcome to FarmWhisper Backend API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/test")
async def test_endpoint():
    return {"message": "Test endpoint working!"}

# Voice processing endpoint
@app.post("/voice/query")
async def process_voice_query(
    audio_file: UploadFile = File(...),
    method: str = Form("google")
):
    """
    Process voice query from audio file and return transcribed text.
    """
    try:
        # In a real implementation, you would process the audio file
        # For this demo, we'll just return mock data
        content = await audio_file.read()
        uploaded_audios[audio_file.filename] = content
        
        return {
            "text": "This is a simulated voice transcription. In a full implementation, this would be the actual transcription of your voice query.",
            "language": "en"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice processing failed: {str(e)}")

# Crop analysis endpoint
@app.post("/crop/analyze")
async def analyze_crop(image: UploadFile = File(...)):
    """
    Analyze crop health from an uploaded image file.
    """
    try:
        # In a real implementation, you would process the image file
        # For this demo, we'll just return mock data
        content = await image.read()
        uploaded_images[image.filename] = content
        
        return {
            "health_score": 72,
            "pest_risk": "medium",
            "issues": ["low moisture", "yellow leaves"],
            "recommendations": [
                "Increase watering frequency",
                "Apply nitrogen-rich fertilizer",
                "Monitor for pest activity"
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Crop analysis failed: {str(e)}")

# Story-based advisory endpoint
@app.post("/advice/story")
async def generate_story_advisory(request: dict):
    """
    Generate poetic, story-based advisory for farmers.
    """
    try:
        # In a real implementation, you would use an LLM
        # For this demo, we'll return mock data
        crop_type = request.get("crop_type", "crop")
        analysis_result = request.get("analysis_result", {})
        
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
    Get weather forecast for a specific location using latitude and longitude.
    """
    try:
        # In a real implementation, you would call a weather API
        # For this demo, we'll return mock data
        return {
            "temperature": 28.5,
            "humidity": 65,
            "rain_probability": 30,
            "description": "Partly cloudy",
            "location": f"Coordinates: {lat}, {lon}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Weather data retrieval failed: {str(e)}")

@app.get("/weather/location")
async def get_weather_by_location(location: str):
    """
    Get weather forecast for a specific location by name.
    """
    try:
        # In a real implementation, you would call a weather API
        # For this demo, we'll return mock data
        return {
            "temperature": 28.5,
            "humidity": 65,
            "rain_probability": 30,
            "description": "Partly cloudy",
            "location": location
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Weather data retrieval failed: {str(e)}")

# Community endpoints
@app.get("/community/")
async def list_community_posts(limit: int = 10, offset: int = 0):
    """
    Get a list of community posts with pagination.
    """
    try:
        # For this demo, we'll return mock data
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
        
        # Apply pagination
        start = offset
        end = offset + limit
        return mock_posts[start:end]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve posts: {str(e)}")

@app.post("/community/")
async def create_community_post(post: dict):
    """
    Create a new post in the community feed.
    """
    try:
        # For this demo, we'll just return the post with an ID
        post["id"] = "new-post-id"
        post["upvotes"] = 0
        post["created_at"] = "2025-11-27T12:00:00Z"
        return post
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create post: {str(e)}")

@app.post("/community/upvote")
async def upvote_community_post(request: dict):
    """
    Upvote a community post.
    """
    try:
        post_id = request.get("post_id")
        # For this demo, we'll just return a success message
        return {
            "message": "Post upvoted successfully",
            "upvotes": 43  # Mock incremented count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upvote post: {str(e)}")

# Audio streaming endpoint for "Listen Story" functionality
@app.get("/audio/story/{story_id}")
async def stream_story_audio(story_id: str):
    """
    Stream audio for a story (simulated).
    """
    try:
        # In a real implementation, you would generate or retrieve actual audio
        # For this demo, we'll return a simple audio-like response
        def generate_audio():
            # This is a placeholder - in reality, you would stream actual audio data
            yield b"RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
        
        return StreamingResponse(generate_audio(), media_type="audio/wav")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio streaming failed: {str(e)}")

# Text-to-speech endpoint for story narration
@app.post("/tts/narrate")
async def narrate_story(request: dict):
    """
    Convert text to speech for story narration.
    """
    try:
        story_text = request.get("text", "")
        # In a real implementation, you would use a TTS engine
        # For this demo, we'll return mock data
        return {
            "message": "Text-to-speech conversion initiated",
            "story_preview": story_text[:100] + "..." if len(story_text) > 100 else story_text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS conversion failed: {str(e)}")