import os
import requests
from dotenv import load_dotenv
import sys

def test_keys():
    load_dotenv()
    gemini_key = os.getenv("GOOGLE_GEMINI_API_KEY")
    weather_key = os.getenv("OPENWEATHER_API_KEY")

    if not gemini_key or gemini_key == "your_gemini_api_key_here":
        print("Gemini API Key missing or invalid")
        sys.exit(1)
        
    if not weather_key or weather_key == "your_openweathermap_key_here":
        print("OpenWeather API Key missing or invalid")
        sys.exit(1)

    print("Testing Gemini API Key...")
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
        payload = {
            "contents": [{"parts": [{"text": "Say OK"}]}]
        }
        resp = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=10)
        if resp.status_code == 200:
            print("Gemini API Key is valid (Status 200).")
        else:
            print(f"Gemini API test failed: {resp.status_code} - {resp.text}")
            sys.exit(1)
    except Exception as e:
        print("Gemini API Key test failed:", e)
        sys.exit(1)

    print("\nTesting OpenWeather API Key...")
    try:
        response = requests.get(f"https://api.openweathermap.org/data/2.5/weather?q=Delhi&appid={weather_key}")
        if response.status_code == 200:
            print("OpenWeather API Key is valid (Status 200).")
        else:
            print(f"OpenWeather API test failed: {response.status_code} - {response.text}")
            sys.exit(1)
    except Exception as e:
        print("OpenWeather API test failed:", e)
        sys.exit(1)

if __name__ == "__main__":
    test_keys()
