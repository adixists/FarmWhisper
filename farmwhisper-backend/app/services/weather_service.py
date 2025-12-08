import os
import requests
from typing import Optional
from app.models.models import WeatherResponse
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key from environment variables
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

def get_weather_data(lat: float, lon: float) -> WeatherResponse:
    """
    Get weather data from OpenWeatherMap API.
    """
    if not OPENWEATHER_API_KEY:
        raise Exception("OpenWeatherMap API key not configured")
    
    try:
        # OpenWeatherMap API endpoint
        url = f"https://api.openweathermap.org/data/2.5/weather"
        
        # Parameters
        params = {
            "lat": lat,
            "lon": lon,
            "appid": OPENWEATHER_API_KEY,
            "units": "metric"  # Celsius
        }
        
        # Make API request
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        # Parse response
        data = response.json()
        
        # Extract relevant information
        temperature = data["main"]["temp"]
        humidity = data["main"]["humidity"]
        
        # Calculate rain probability (simplified)
        # In a real implementation, you would use a more sophisticated weather API
        # that provides precipitation probability directly
        rain_probability = 0.0
        if "rain" in data:
            # If rain data is available, use it
            rain_probability = data["rain"].get("1h", 0) * 10  # Convert to percentage (approximation)
        else:
            # Otherwise, use cloud coverage as a proxy
            cloud_coverage = data["clouds"]["all"]
            # Simple heuristic: higher cloud coverage = higher rain probability
            rain_probability = min(100, cloud_coverage * 0.8)
        
        # Get weather description
        description = data["weather"][0]["description"].title()
        
        # Get location name
        location = f"{data['name']}, {data['sys']['country']}"
        
        return WeatherResponse(
            temperature=temperature,
            humidity=humidity,
            rain_probability=rain_probability,
            description=description,
            location=location
        )
    
    except requests.exceptions.RequestException as e:
        raise Exception(f"Weather API request failed: {str(e)}")
    except KeyError as e:
        raise Exception(f"Unexpected response format from weather API: missing key {str(e)}")
    except Exception as e:
        raise Exception(f"Weather data retrieval failed: {str(e)}")

def get_weather_by_location(location: str) -> WeatherResponse:
    """
    Get weather data by location name.
    """
    if not OPENWEATHER_API_KEY:
        raise Exception("OpenWeatherMap API key not configured")
    
    try:
        # OpenWeatherMap API endpoint for location search
        url = f"https://api.openweathermap.org/data/2.5/weather"
        
        # Parameters
        params = {
            "q": location,
            "appid": OPENWEATHER_API_KEY,
            "units": "metric"  # Celsius
        }
        
        # Make API request
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        # Parse response
        data = response.json()
        
        # Extract relevant information
        temperature = data["main"]["temp"]
        humidity = data["main"]["humidity"]
        
        # Calculate rain probability (simplified)
        rain_probability = 0.0
        if "rain" in data:
            rain_probability = data["rain"].get("1h", 0) * 10  # Convert to percentage (approximation)
        else:
            cloud_coverage = data["clouds"]["all"]
            rain_probability = min(100, cloud_coverage * 0.8)
        
        # Get weather description
        description = data["weather"][0]["description"].title()
        
        # Get location name
        location_name = f"{data['name']}, {data['sys']['country']}"
        
        return WeatherResponse(
            temperature=temperature,
            humidity=humidity,
            rain_probability=rain_probability,
            description=description,
            location=location_name
        )
    
    except requests.exceptions.RequestException as e:
        raise Exception(f"Weather API request failed: {str(e)}")
    except KeyError as e:
        raise Exception(f"Unexpected response format from weather API: missing key {str(e)}")
    except Exception as e:
        raise Exception(f"Weather data retrieval failed: {str(e)}")