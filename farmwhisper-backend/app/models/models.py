from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    farmer = "farmer"
    agronomist = "agronomist"
    admin = "admin"

class User(BaseModel):
    id: Optional[str] = None
    phone_number: str
    name: Optional[str] = None
    role: UserRole = UserRole.farmer
    created_at: datetime = datetime.now()

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    phone_number: str

class VoiceQueryRequest(BaseModel):
    # This will be used for form data, so we'll define it in the route
    pass

class VoiceQueryResponse(BaseModel):
    text: str
    language: str = "en"

class CropHealthAnalysis(BaseModel):
    health_score: int  # 0-100
    pest_risk: str  # low, medium, high
    issues: List[str]
    recommendations: List[str]

class CropAnalysisRequest(BaseModel):
    # This will be used for form data, so we'll define it in the route
    pass

class CropAnalysisResponse(CropHealthAnalysis):
    pass

class AdvisoryRequest(BaseModel):
    crop_type: str
    analysis_result: CropHealthAnalysis

class AdvisoryResponse(BaseModel):
    story: str
    tips: List[str]

class WeatherResponse(BaseModel):
    temperature: float
    humidity: float
    rain_probability: float
    description: str
    location: str

class CommunityPost(BaseModel):
    id: Optional[str] = None
    user_id: str
    title: str
    content: str
    upvotes: int = 0
    created_at: datetime = datetime.now()
    tags: List[str] = []

class CommunityPostCreate(BaseModel):
    user_id: str
    title: str
    content: str
    tags: List[str] = []

class CommunityPostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None

class UpvoteRequest(BaseModel):
    post_id: str
    user_id: str