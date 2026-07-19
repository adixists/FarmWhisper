from fastapi import APIRouter, HTTPException, Query
from app.models.models import WeatherResponse
from app.services.weather_service import get_weather_data, get_weather_by_location

router = APIRouter()

@router.get("/forecast", response_model=WeatherResponse, summary="Get weather forecast")
async def get_weather(
    lat: float = Query(..., description="Latitude of the location", ge=-90, le=90),
    lon: float = Query(..., description="Longitude of the location", ge=-180, le=180)
):
    """
    Get weather forecast for a specific location using latitude and longitude.
    
    - **lat**: Latitude of the location (-90 to 90)
    - **lon**: Longitude of the location (-180 to 180)
    """
    try:
        weather_data = get_weather_data(lat, lon)
        return weather_data
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Weather data retrieval failed: {str(e)}")

@router.get("/location", response_model=WeatherResponse, summary="Get weather by location name")
async def get_weather_by_name(
    location: str = Query(..., description="Location name (e.g., 'New York', 'London')", min_length=1)
):
    """
    Get weather forecast for a specific location by name.
    
    - **location**: Name of the location (e.g., 'New York', 'London')
    """
    try:
        weather_data = get_weather_by_location(location)
        return weather_data
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Weather data retrieval failed: {str(e)}")