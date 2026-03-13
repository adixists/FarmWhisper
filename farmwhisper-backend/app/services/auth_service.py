import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional
from app.models.database import users_collection
from app.models.models import User, Token

# In production, use a proper JWT library and secure storage
# For simplicity, we'll use a basic token system

# Store tokens in memory (in production, use Redis or database)
active_tokens = {}

def generate_otp() -> str:
    """Generate a 6-digit OTP"""
    return str(secrets.randbelow(1000000)).zfill(6)

def hash_token(token: str) -> str:
    """Hash token for secure storage"""
    return hashlib.sha256(token.encode()).hexdigest()

def send_otp(phone_number: str) -> str:
    """
    Simulate sending OTP to phone number
    In production, integrate with SMS service like Twilio
    """
    otp = generate_otp()
    # In production, send OTP via SMS
    print(f"Sending OTP {otp} to {phone_number}")
    return otp

def verify_otp(phone_number: str, otp: str, expected_otp: str) -> bool:
    """Verify OTP"""
    return otp == expected_otp

def create_user(phone_number: str, name: str = None) -> User:
    """Create a new user"""
    user = User(
        phone_number=phone_number,
        name=name
    )
    result = users_collection.insert_one(user.dict())
    user.id = str(result.inserted_id)
    return user

def get_user_by_phone(phone_number: str) -> Optional[User]:
    """Get user by phone number"""
    user_data = users_collection.find_one({"phone_number": phone_number})
    if user_data:
        user_data["id"] = str(user_data["_id"])
        del user_data["_id"]
        return User(**user_data)
    return None

def generate_access_token(user_id: str) -> str:
    """Generate access token"""
    token = secrets.token_urlsafe(32)
    hashed_token = hash_token(token)
    
    # Store token with expiration (24 hours)
    expiration = datetime.utcnow() + timedelta(hours=24)
    active_tokens[hashed_token] = {
        "user_id": user_id,
        "expires_at": expiration
    }
    
    return token

def verify_token(token: str) -> Optional[str]:
    """Verify token and return user_id if valid"""
    hashed_token = hash_token(token)
    
    if hashed_token in active_tokens:
        token_data = active_tokens[hashed_token]
        if datetime.utcnow() < token_data["expires_at"]:
            return token_data["user_id"]
        else:
            # Token expired, remove it
            del active_tokens[hashed_token]
    
    return None

def revoke_token(token: str) -> bool:
    """Revoke token"""
    hashed_token = hash_token(token)
    if hashed_token in active_tokens:
        del active_tokens[hashed_token]
        return True
    return False