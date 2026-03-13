from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import Optional
import os
import io
import base64
import json
import tempfile
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
GOOGLE_GEMINI_API_KEY = os.getenv("GOOGLE_GEMINI_API_KEY", "")

app = FastAPI(
    title="FarmWhisper - AI Voice & Vision Assistant for Farmers",
    description="Backend API for FarmWhisper mobile application",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────
# Health
# ─────────────────────────────────────────

@app.get("/")
async def root():
    return {"message": "Welcome to FarmWhisper Backend API v2.0"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "openweather_configured": bool(OPENWEATHER_API_KEY and OPENWEATHER_API_KEY != "your_openweathermap_key_here"),
        "gemini_configured": bool(GOOGLE_GEMINI_API_KEY and GOOGLE_GEMINI_API_KEY != "your_gemini_api_key_here"),
    }

@app.get("/test")
async def test_endpoint():
    return {"message": "Test endpoint working!"}

# ─────────────────────────────────────────
# Weather – Real OpenWeatherMap
# ─────────────────────────────────────────

def _parse_owm(data: dict) -> dict:
    temperature = data["main"]["temp"]
    humidity = data["main"]["humidity"]
    rain_probability = 0.0
    if "rain" in data:
        rain_probability = min(100, data["rain"].get("1h", 0) * 10)
    else:
        cloud_coverage = data.get("clouds", {}).get("all", 0)
        rain_probability = min(100, cloud_coverage * 0.8)
    description = data["weather"][0]["description"].title()
    location = f"{data.get('name', 'Unknown')}, {data.get('sys', {}).get('country', '')}"
    return {
        "temperature": round(temperature, 1),
        "humidity": humidity,
        "rain_probability": round(rain_probability, 1),
        "description": description,
        "location": location,
        "wind_speed": round(data.get("wind", {}).get("speed", 0), 1),
        "feels_like": round(data["main"].get("feels_like", temperature), 1),
    }

@app.get("/weather/forecast")
async def get_weather_forecast(lat: float, lon: float):
    if not OPENWEATHER_API_KEY or OPENWEATHER_API_KEY == "your_openweathermap_key_here":
        # Fallback mock (clearly labelled)
        return {
            "temperature": 28.5, "humidity": 65, "rain_probability": 30,
            "description": "Partly Cloudy (demo - add API key)", "location": f"Lat:{lat}, Lon:{lon}",
            "wind_speed": 12, "feels_like": 30.1,
        }
    try:
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {"lat": lat, "lon": lon, "appid": OPENWEATHER_API_KEY, "units": "metric"}
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        return _parse_owm(response.json())
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Weather API error: {str(e)}")

@app.get("/weather/location")
async def get_weather_by_location(location: str):
    if not OPENWEATHER_API_KEY or OPENWEATHER_API_KEY == "your_openweathermap_key_here":
        return {
            "temperature": 28.5, "humidity": 65, "rain_probability": 30,
            "description": "Partly Cloudy (demo - add API key)", "location": location,
            "wind_speed": 12, "feels_like": 30.1,
        }
    try:
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {"q": location, "appid": OPENWEATHER_API_KEY, "units": "metric"}
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        return _parse_owm(response.json())
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Weather API error: {str(e)}")

# ─────────────────────────────────────────
# Crop Analysis – Google Gemini Vision
# ─────────────────────────────────────────

def _gemini_analyze_crop(image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
    """Call Gemini 1.5 Flash vision API to analyze a crop image."""
    import google.generativeai as genai
    genai.configure(api_key=GOOGLE_GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = """You are an expert agricultural scientist. Analyze this crop/plant image carefully and respond ONLY with valid JSON in this exact format:
{
  "crop_name": "name of the crop or plant in English",
  "crop_name_hindi": "name of the crop in Hindi",
  "health_status": "Healthy | Stressed | Diseased | Damaged",
  "health_score": 0_to_100_integer,
  "needs_water": true_or_false,
  "issues": ["list", "of", "detected", "issues"],
  "pest_risk": "low | medium | high",
  "diseases": ["list of detected diseases, empty if none"],
  "fertilizer_recommendation": "specific fertilizer name and dosage, or 'Not required'",
  "remedy": "specific treatment or action to take",
  "recommendations": ["actionable", "recommendation", "list"]
}
Be specific and practical. Focus on what an Indian farmer needs to know."""

    image_part = {
        "inline_data": {
            "mime_type": mime_type,
            "data": base64.b64encode(image_bytes).decode("utf-8"),
        }
    }

    response = model.generate_content([prompt, image_part])
    text = response.text.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())


@app.post("/crop/analyze")
async def analyze_crop(image: UploadFile = File(...)):
    content = await image.read()

    if not GOOGLE_GEMINI_API_KEY or GOOGLE_GEMINI_API_KEY == "your_gemini_api_key_here":
        # Realistic mock when key is missing
        return {
            "crop_name": "Wheat (Demo)",
            "crop_name_hindi": "गेहूं (डेमो)",
            "health_status": "Stressed",
            "health_score": 62,
            "needs_water": True,
            "issues": ["low moisture", "yellow leaves"],
            "pest_risk": "medium",
            "diseases": [],
            "fertilizer_recommendation": "Urea @ 5g per litre water (foliar spray)",
            "remedy": "Irrigate immediately, apply nitrogen fertilizer after 2 days",
            "recommendations": [
                "Increase watering frequency – irrigate every 3 days",
                "Apply nitrogen-rich fertilizer (Urea or DAP)",
                "Monitor for aphid pest activity on underside of leaves",
            ],
        }

    try:
        mime_type = image.content_type or "image/jpeg"
        result = _gemini_analyze_crop(content, mime_type)
        return result
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Gemini returned unexpected format. Try again.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Crop analysis failed: {str(e)}")

# ─────────────────────────────────────────
# Story Advisory – Google Gemini Text
# ─────────────────────────────────────────

def _gemini_generate_story(crop_type: str, issues: list, recommendations: list) -> dict:
    import google.generativeai as genai
    genai.configure(api_key=GOOGLE_GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")

    issues_str = ", ".join(issues) if issues else "general care needed"
    recs_str = "; ".join(recommendations) if recommendations else "maintain current routine"

    prompt = f"""You are a wise Indian farming elder speaking in poetic, storytelling language.
A farmer's {crop_type} crop shows these issues: {issues_str}.
The expert recommendations are: {recs_str}.

Write a SHORT poetic advisory in Hindi (2-3 sentences) that:
1. Describes the crop's situation metaphorically (like dadi/nani would tell)
2. Gives the key advice poetically

Then separately list 3 practical tips in simple Hindi/English.

Respond in JSON format only:
{{
  "story": "poetic Hindi story text here",
  "tips": ["tip 1", "tip 2", "tip 3"]
}}"""

    response = model.generate_content(prompt)
    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())


@app.post("/advice/story")
async def generate_story_advisory(request: dict):
    crop_type = request.get("crop_type", "फसल")
    analysis = request.get("analysis_result", {})
    issues = analysis.get("issues", [])
    recommendations = analysis.get("recommendations", [])

    if not GOOGLE_GEMINI_API_KEY or GOOGLE_GEMINI_API_KEY == "your_gemini_api_key_here":
        return {
            "story": f"मिट्टी प्यास की गुहार लगाती है — पुरानी नदी के मोड़ से जल लाओ। जैसे दादी कहती थीं, {crop_type} को संतुलन चाहिए — न ज़्यादा, न कम। सुनहरी धूप आपके खेतों पर मुस्कुराती है, उन लोगों के लिए समृद्धि का वादा करती है जो प्रकृति की लय सुनते हैं।",
            "tips": [
                "सुबह जल्दी सिंचाई करें",
                "जैविक खाद डालें",
                "कीटों की नियमित जाँच करें",
            ],
        }

    try:
        return _gemini_generate_story(crop_type, issues, recommendations)
    except Exception as e:
        return {
            "story": f"आपकी {crop_type} फसल की देखभाल ज़रूरी है। प्रकृति का संतुलन बनाए रखें।",
            "tips": recommendations[:3] if recommendations else ["फसल की नियमित देखभाल करें"],
        }

# ─────────────────────────────────────────
# Voice – STT using Google Speech Recognition
# ─────────────────────────────────────────

@app.post("/voice/query")
async def process_voice_query(
    audio_file: UploadFile = File(...),
    method: str = Form("google"),
    language_preference: Optional[str] = Form(None),
):
    try:
        content = await audio_file.read()
        suffix = os.path.splitext(audio_file.filename or "recording.wav")[1] or ".wav"

        # Save temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            import speech_recognition as sr
            from pydub import AudioSegment

            # Convert to WAV if needed
            audio = AudioSegment.from_file(tmp_path)
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as wav_tmp:
                wav_path = wav_tmp.name
            audio.export(wav_path, format="wav")

            recognizer = sr.Recognizer()
            with sr.AudioFile(wav_path) as source:
                audio_data = recognizer.record(source)

            # Try Hindi first (India-focused app), then English
            text = None
            language = "unknown"
            try:
                text = recognizer.recognize_google(audio_data, language="hi-IN")
                language = "hi"
            except sr.UnknownValueError:
                pass

            if not text:
                try:
                    text = recognizer.recognize_google(audio_data, language="en-IN")
                    language = "en"
                except sr.UnknownValueError:
                    text = "आवाज़ समझ नहीं आई। कृपया दोबारा बोलें।"
                    language = "unknown"

            os.unlink(tmp_path)
            os.unlink(wav_path)

            # If Gemini is available, also get an AI response to the query
            ai_response = None
            if GOOGLE_GEMINI_API_KEY and GOOGLE_GEMINI_API_KEY != "your_gemini_api_key_here" and text and language != "unknown":
                try:
                    import google.generativeai as genai
                    genai.configure(api_key=GOOGLE_GEMINI_API_KEY)
                    model = genai.GenerativeModel("gemini-1.5-flash")
                    farmer_prompt = f"""You are FarmWhisper, an AI assistant for Indian farmers. 
A farmer asked (in {language}): "{text}"
Answer their farming question clearly in 2-3 sentences in the same language they used. 
Be practical, specific to Indian farming conditions. If it's not a farming question, politely redirect."""
                    resp = model.generate_content(farmer_prompt)
                    ai_response = resp.text.strip()
                except Exception:
                    pass

            return {"text": text, "language": language, "ai_response": ai_response}

        except ImportError as e:
            os.unlink(tmp_path)
            raise HTTPException(status_code=500, detail=f"Speech recognition library missing: {str(e)}")
        except Exception as e:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass
            raise HTTPException(status_code=500, detail=f"Voice processing failed: {str(e)}")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice processing failed: {str(e)}")

# ─────────────────────────────────────────
# TTS – Return confirmation (browser handles TTS)
# ─────────────────────────────────────────

@app.post("/tts/narrate")
async def narrate_story(request: dict):
    """Frontend uses Web Speech API for TTS. This endpoint returns the text to speak."""
    story_text = request.get("text", "")
    return {
        "message": "Use browser Web Speech API to narrate",
        "text": story_text,
        "language": "hi-IN",
    }

# ─────────────────────────────────────────
# Community
# ─────────────────────────────────────────

MOCK_POSTS = [
    {
        "id": "1", "user_id": "user1",
        "title": "Traditional Rain Prediction Method",
        "content": "My grandmother always said: when peacocks dance and frogs croak loudly, rain is coming in 24 hours. This has helped me plan my farming activities for decades!",
        "upvotes": 42, "created_at": "2025-11-27T10:30:00Z",
        "tags": ["traditional knowledge", "weather prediction"]
    },
    {
        "id": "2", "user_id": "user2",
        "title": "Natural Pest Control",
        "content": "Neem oil spray works wonders! Mix 2 tablespoons of neem oil with 1 liter of water and a few drops of dish soap. Spray on plants in the evening to avoid burning leaves.",
        "upvotes": 38, "created_at": "2025-11-26T14:15:00Z",
        "tags": ["pest control", "organic farming"]
    },
    {
        "id": "3", "user_id": "user3",
        "title": "Soil Health Improvement",
        "content": "Cow dung + wood ash + water = excellent fertilizer. Let it sit for a week, then dilute 1:10 before applying to crops. My wheat yield increased by 30% last season!",
        "upvotes": 56, "created_at": "2025-11-25T09:45:00Z",
        "tags": ["soil health", "fertilizer"]
    },
    {
        "id": "4", "user_id": "user4",
        "title": "Intercropping Tips",
        "content": "Growing maize with beans increases yield by 25%. Beans fix nitrogen in soil, which benefits maize. Tried this on 2 acres last kharif — great results!",
        "upvotes": 71, "created_at": "2025-11-24T08:00:00Z",
        "tags": ["intercropping", "yield improvement"]
    },
]

community_posts = list(MOCK_POSTS)

@app.get("/community/")
async def list_community_posts(limit: int = 10, offset: int = 0):
    return community_posts[offset:offset + limit]

@app.post("/community/")
async def create_community_post(post: dict):
    import uuid
    from datetime import datetime
    post["id"] = str(uuid.uuid4())
    post["upvotes"] = 0
    post["created_at"] = datetime.utcnow().isoformat() + "Z"
    community_posts.insert(0, post)
    return post

@app.post("/community/upvote")
async def upvote_community_post(request: dict):
    post_id = request.get("post_id")
    for p in community_posts:
        if p["id"] == post_id:
            p["upvotes"] = p.get("upvotes", 0) + 1
            return {"message": "Post upvoted successfully", "upvotes": p["upvotes"]}
    raise HTTPException(status_code=404, detail="Post not found")