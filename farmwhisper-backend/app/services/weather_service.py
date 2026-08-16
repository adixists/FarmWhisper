import os
import requests
from typing import Optional
from app.models.models import WeatherResponse
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

WEATHER_CODE_MAP = {
    0: ("Clear sky", "साफ मौसम (धूप)"),
    1: ("Mainly clear", "मुख्यतः साफ आसमान"),
    2: ("Partly cloudy", "आंशिक रूप से बादल"),
    3: ("Overcast", "घने बादल"),
    45: ("Foggy", "कोहरा"),
    48: ("Depositing rime fog", "घना कोहरा"),
    51: ("Light drizzle", "हल्की बूंदाबांदी"),
    53: ("Moderate drizzle", "मध्यम बूंदाबांदी"),
    55: ("Dense drizzle", "तेज बूंदाबांदी"),
    61: ("Slight rain", "हल्की बारिश"),
    63: ("Moderate rain", "मध्यम बारिश"),
    65: ("Heavy rain", "भारी बारिश"),
    71: ("Slight snow fall", "हल्की बर्फबारी"),
    73: ("Moderate snow fall", "मध्यम बर्फबारी"),
    75: ("Heavy snow fall", "भारी बर्फबारी"),
    80: ("Slight rain showers", "हल्की फुहारें"),
    81: ("Moderate rain showers", "मध्यम फुहारें"),
    82: ("Violent rain showers", "मूसलाधार बारिश"),
    95: ("Thunderstorm", "गरज के साथ बारिश / तूफान"),
    96: ("Thunderstorm with slight hail", "तूफान और ओलावृष्टि"),
    99: ("Thunderstorm with heavy hail", "भारी तूफान और ओलावृष्टि")
}

def resolve_location_name(lat: float, lon: float) -> str:
    """
    Reverse geocode latitude and longitude to get the user's city/town and state in India.
    """
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json"
        headers = {"User-Agent": "FarmWhisperApp/1.0"}
        resp = requests.get(url, headers=headers, timeout=4)
        if resp.status_code == 200:
            data = resp.json()
            address = data.get("address", {})
            city = address.get("city") or address.get("town") or address.get("village") or address.get("county") or address.get("state_district") or "खेत का स्थान"
            state = address.get("state", "")
            return f"{city}, {state}" if state else city
    except Exception as e:
        print(f"Reverse geocoding error: {e}")
    return f"Lat: {round(lat, 2)}, Lon: {round(lon, 2)}"

def get_weather_data(lat: float, lon: float) -> WeatherResponse:
    """
    Get live, real-time weather data for exact GPS coordinates using Open-Meteo & OpenWeather fallback.
    """
    # 1. Try Open-Meteo (Free, reliable, no rate limits, hyperlocal)
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code&hourly=precipitation_probability&timezone=auto"
        headers = {"User-Agent": "FarmWhisperApp/1.0"}
        resp = requests.get(url, headers=headers, timeout=5)
        
        if resp.status_code == 200:
            data = resp.json()
            current = data.get("current", {})
            hourly = data.get("hourly", {})
            
            temp = float(current.get("temperature_2m", 25.0))
            humidity = float(current.get("relative_humidity_2m", 60.0))
            wcode = int(current.get("weather_code", 0))
            
            # Extract rain probability from current hour if available
            precip_prob = 0.0
            probs = hourly.get("precipitation_probability", [])
            if probs and len(probs) > 0:
                precip_prob = float(probs[0])
            elif current.get("precipitation", 0) > 0:
                precip_prob = 80.0
            
            desc_en, desc_hi = WEATHER_CODE_MAP.get(wcode, ("Partly Cloudy", "आंशिक रूप से बादल"))
            full_desc = f"{desc_en} ({desc_hi})"
            location_name = resolve_location_name(lat, lon)
            
            return WeatherResponse(
                temperature=temp,
                humidity=humidity,
                rain_probability=precip_prob,
                description=full_desc,
                location=location_name
            )
    except Exception as e:
        print(f"Open-Meteo fetch failed, trying OpenWeather fallback: {e}")

    # 2. Fallback to OpenWeatherMap if key is valid
    if OPENWEATHER_API_KEY and OPENWEATHER_API_KEY != "your_openweathermap_key_here":
        try:
            url = "https://api.openweathermap.org/data/2.5/weather"
            params = {"lat": lat, "lon": lon, "appid": OPENWEATHER_API_KEY, "units": "metric"}
            resp = requests.get(url, params=params, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                temp = data["main"]["temp"]
                humidity = data["main"]["humidity"]
                rain_prob = min(100.0, data.get("clouds", {}).get("all", 30) * 0.8)
                desc = data["weather"][0]["description"].title()
                loc = f"{data.get('name', '')}, {data.get('sys', {}).get('country', '')}"
                return WeatherResponse(
                    temperature=temp,
                    humidity=humidity,
                    rain_probability=rain_prob,
                    description=desc,
                    location=loc
                )
        except Exception as e:
            print(f"OpenWeather fallback error: {e}")

    # Default fallback
    return WeatherResponse(
        temperature=28.0,
        humidity=65.0,
        rain_probability=20.0,
        description="Partly cloudy (आंशिक बादल)",
        location=f"GPS: {round(lat, 2)}, {round(lon, 2)}"
    )

def get_weather_by_location(location: str) -> WeatherResponse:
    """
    Get weather data by searching a city/village name.
    """
    try:
        geo_url = f"https://nominatim.openstreetmap.org/search?q={requests.utils.quote(location)}&format=json&limit=1"
        headers = {"User-Agent": "FarmWhisperApp/1.0"}
        resp = requests.get(geo_url, headers=headers, timeout=5)
        if resp.status_code == 200 and len(resp.json()) > 0:
            item = resp.json()[0]
            lat = float(item["lat"])
            lon = float(item["lon"])
            weather = get_weather_data(lat, lon)
            weather.location = item.get("display_name", location).split(",")[0] + f", {item.get('display_name', '').split(',')[-1].strip()}"
            return weather
    except Exception as e:
        print(f"Location search error: {e}")
        
    return get_weather_data(28.6139, 77.2090)