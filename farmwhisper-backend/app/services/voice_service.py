import os
import tempfile
from typing import Tuple
import speech_recognition as sr
from pydub import AudioSegment

def convert_audio_to_wav(audio_file_path: str) -> str:
    """
    Convert audio file to WAV format if needed
    """
    try:
        # Load audio file
        audio = AudioSegment.from_file(audio_file_path)
        
        # Create temporary WAV file
        temp_wav = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
        audio.export(temp_wav.name, format="wav")
        
        return temp_wav.name
    except Exception as e:
        raise Exception(f"Failed to convert audio to WAV: {str(e)}")

def recognize_speech_offline(audio_file_path: str) -> Tuple[str, str]:
    """
    Recognize speech using offline speech recognition
    Returns tuple of (recognized_text, language)
    """
    try:
        # Convert to WAV if needed
        wav_file_path = convert_audio_to_wav(audio_file_path)
        
        # Initialize recognizer
        recognizer = sr.Recognizer()
        
        # Load audio file
        with sr.AudioFile(wav_file_path) as source:
            audio_data = recognizer.record(source)
        
        # Recognize speech
        try:
            # Try recognizing with default language (English)
            text = recognizer.recognize_google(audio_data)
            language = "en"
        except sr.UnknownValueError:
            # If English fails, try Hindi (common in Indian agriculture)
            try:
                text = recognizer.recognize_google(audio_data, language="hi-IN")
                language = "hi"
            except sr.UnknownValueError:
                text = "Could not understand audio"
                language = "unknown"
        except sr.RequestError as e:
            raise Exception(f"Could not request results from Google Speech Recognition service; {e}")
        
        # Clean up temporary file
        os.unlink(wav_file_path)
        
        return text, language
    
    except Exception as e:
        raise Exception(f"Speech recognition failed: {str(e)}")

def recognize_speech_vosk(audio_file_path: str) -> Tuple[str, str]:
    """
    Recognize speech using Vosk offline recognition
    Returns tuple of (recognized_text, language)
    """
    try:
        # Import vosk here to avoid issues if not installed
        from vosk import Model, KaldiRecognizer
        import json
        
        # Convert to WAV if needed (Vosk works best with WAV)
        wav_file_path = convert_audio_to_wav(audio_file_path)
        
        # Load audio file
        audio = AudioSegment.from_wav(wav_file_path)
        audio = audio.set_channels(1)  # Mono channel
        audio = audio.set_frame_rate(16000)  # 16kHz sample rate
        
        # Save processed audio
        processed_wav = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
        audio.export(processed_wav.name, format="wav")
        
        # Initialize Vosk model (you need to download the model separately)
        # For Hindi, you would use a Hindi model
        model = Model(model_name="vosk-model-small-en-us-0.15")  # English model
        rec = KaldiRecognizer(model, 16000)
        
        # Process audio
        with open(processed_wav.name, "rb") as f:
            f.read(44)  # Skip header
            while True:
                data = f.read(2000)
                if len(data) == 0:
                    break
                if rec.AcceptWaveform(data):
                    pass
        
        # Get final result
        result = json.loads(rec.FinalResult())
        text = result.get("text", "")
        language = "en"
        
        # Clean up temporary files
        os.unlink(wav_file_path)
        os.unlink(processed_wav.name)
        
        return text, language
    
    except ImportError:
        raise Exception("Vosk library not installed or model not found")
    except Exception as e:
        raise Exception(f"Vosk speech recognition failed: {str(e)}")

def process_voice_query(audio_file_path: str, method: str = "google") -> Tuple[str, str]:
    """
    Process voice query using specified method
    Returns tuple of (recognized_text, language)
    """
    if method == "vosk":
        return recognize_speech_vosk(audio_file_path)
    else:
        return recognize_speech_offline(audio_file_path)