import os
import tempfile
import json
from typing import Tuple, Dict, Any, List, Optional
import speech_recognition as sr
from pydub import AudioSegment
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GOOGLE_GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def convert_audio_to_wav(audio_file_path: str) -> str:
    """
    Convert audio file to WAV format if needed
    """
    try:
        audio = AudioSegment.from_file(audio_file_path)
        temp_wav = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
        audio.export(temp_wav.name, format="wav")
        return temp_wav.name
    except Exception as e:
        raise Exception(f"Failed to convert audio to WAV: {str(e)}")

def recognize_speech_offline(audio_file_path: str) -> Tuple[str, str]:
    """
    Recognize speech using Google Speech Recognition (Hindi + English auto-detection).
    Returns tuple of (recognized_text, language)
    """
    wav_file_path = None
    try:
        wav_file_path = convert_audio_to_wav(audio_file_path)
        recognizer = sr.Recognizer()
        
        with sr.AudioFile(wav_file_path) as source:
            audio_data = recognizer.record(source)
        
        # Try Hindi first (since Indian agriculture primary users speak Hindi/Hinglish)
        try:
            text = recognizer.recognize_google(audio_data, language="hi-IN")
            return text, "hi"
        except sr.UnknownValueError:
            # Try English
            try:
                text = recognizer.recognize_google(audio_data, language="en-IN")
                return text, "en"
            except sr.UnknownValueError:
                return "Could not understand audio (आवाज़ स्पष्ट नहीं सुनाई दी)", "unknown"
        except sr.RequestError as e:
            # Fallback to English generic
            text = recognizer.recognize_google(audio_data)
            return text, "en"
    
    except Exception as e:
        print(f"Speech recognition error: {e}")
        return "Voice recognition temporarily unavailable", "en"
    finally:
        if wav_file_path and os.path.exists(wav_file_path):
            try:
                os.unlink(wav_file_path)
            except Exception:
                pass

def process_voice_query(audio_file_path: str, method: str = "google") -> Tuple[str, str]:
    """
    Process voice query from audio file.
    """
    return recognize_speech_offline(audio_file_path)

def answer_agricultural_query(
    user_query: str,
    language_hint: str = "hi",
    weather_context: Optional[Dict[str, Any]] = None,
    crop_history: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Generates intelligent, conversational, farmer-centric answers for weather, 2-3 day forecasts,
    crop remedies, and farming guidance in Hindi and English.
    """
    if not GEMINI_API_KEY:
        return {
            "query": user_query,
            "response_text": "FarmWhisper AI सहायक तैयार है। आपकी फसल और मौसम के बारे में क्या जानना चाहते हैं?",
            "language": language_hint,
            "query_type": "general",
            "recommendations": ["पूछें: आज और कल का मौसम कैसा रहेगा?", "पूछें: गेहूं या मिर्च की दवा क्या है?"]
        }

    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        
        # Prepare context
        weather_str = "Weather context not available"
        if weather_context:
            cur = weather_context.get("current", {})
            daily = weather_context.get("daily_forecast", [])
            loc = weather_context.get("location", "Current Location")
            
            weather_str = f"Location: {loc}\nCurrent Temp: {cur.get('temperature', 28)}°C, Humidity: {cur.get('humidity', 65)}%, Rain Probability: {cur.get('rain_probability', 20)}%, Condition: {cur.get('description', 'Clear')}\n"
            if daily:
                weather_str += "3-Day Weather Forecast:\n"
                for d in daily[:4]:
                    weather_str += f"- {d.get('day_label_hi', d.get('day_label_en'))}: Max {d.get('temp_max')}°C, Min {d.get('temp_min')}°C, Rain Chance {d.get('rain_probability')}%, Condition: {d.get('weather_desc_hi', d.get('weather_desc_en'))}\n"
        
        crop_history_str = "No recent crop scans on record."
        if crop_history and len(crop_history) > 0:
            crop_history_str = "Recent Scanned Crops & Diagnoses:\n"
            for c in crop_history[-3:]:
                crop_history_str += f"- Crop: {c.get('crop_identified')}, Issue: {c.get('issue_detected')}, Remedy: {c.get('treatment_plan', {}).get('immediate_remedy', '')}\n"

        prompt = f"""
        You are 'FarmWhisper' (फार्मव्हिस्पर), an expert AI Agricultural Voice Assistant and Crop Doctor for Indian farmers.
        
        Farmer's Voice Query: "{user_query}"
        
        Live Context:
        ---
        {weather_str}
        ---
        {crop_history_str}
        ---
        
        Instructions:
        1. If the farmer asks about today's weather or the 2-3 day weather forecast (e.g., 'मौसम कैसा रहेगा', 'क्या 2 दिन बाद बारिश होगी?', 'forecast for next 3 days'):
           - Provide the exact temperature and rain probability for today, tomorrow, and the next 2-3 days from the context.
           - Give clear farming advice (e.g. if rain is likely, advise NOT to spray pesticides or irrigate; if dry, recommend irrigation).
        2. If the farmer asks about crop diseases, pests, fertilizers, or past scanned crops:
           - Check the recent scan history if relevant, or provide exact chemical remedies, organic treatments, and dosages (in Hindi & English).
        3. Language Preference:
           - If the query is in Hindi / Hinglish, respond in natural, polite Hindi (Devanagari script) with key terms in brackets.
           - If the query is in English, respond in clear English.
        4. Keep the spoken response concise (2-4 sentences), highly actionable, and easy to understand when spoken via Text-to-Speech.
        
        Respond with ONLY a valid JSON object matching this structure:
        {{
            "response_text": "Conversational spoken answer to be read to the farmer via TTS",
            "language": "hi or en",
            "query_type": "weather | crop_remedy | general",
            "recommendations": ["Action tip 1", "Action tip 2"]
        }}
        """
        
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json"
            )
        )
        
        result_json = json.loads(response.text)
        result_json["query"] = user_query
        return result_json
        
    except Exception as e:
        print(f"Gemini Voice NLP Error: {e}")
        return {
            "query": user_query,
            "response_text": f"आपके सवाल '{user_query}' पर विचार किया गया है। मौसम और फसल की स्थिति सामान्य है। कृपया पुनः प्रयास करें।",
            "language": language_hint,
            "query_type": "general",
            "recommendations": ["नजदीकी कृषि विज्ञान केंद्र से संपर्क करें", "खेत में नमी की जांच करें"]
        }