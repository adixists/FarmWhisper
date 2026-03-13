from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
from app.models.models import User, Token
from app.services.auth_service import (
    send_otp, verify_otp, create_user, get_user_by_phone, 
    generate_access_token, verify_token
)
from app.utils.validation import validate_phone_number
from app.utils.exceptions import ValidationException

router = APIRouter()

# In-memory storage for OTPs (in production, use Redis or database)
pending_otps = {}

@router.post("/send-otp", summary="Send OTP to phone number")
async def send_otp_endpoint(phone_number: str):
    """
    Send OTP to the provided phone number.
    """
    # Validate phone number
    if not validate_phone_number(phone_number):
        raise HTTPException(status_code=400, detail="Invalid phone number format")
    
    try:
        otp = send_otp(phone_number)
        pending_otps[phone_number] = otp
        return {"message": "OTP sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send OTP: {str(e)}")

@router.post("/verify-otp", response_model=Token, summary="Verify OTP and get access token")
async def verify_otp_endpoint(phone_number: str, otp: str):
    """
    Verify OTP and return access token.
    """
    # Validate phone number
    if not validate_phone_number(phone_number):
        raise HTTPException(status_code=400, detail="Invalid phone number format")
    
    if phone_number not in pending_otps:
        raise HTTPException(status_code=400, detail="OTP not requested for this number")
    
    expected_otp = pending_otps[phone_number]
    if verify_otp(phone_number, otp, expected_otp):
        try:
            # OTP verified, create or get user
            user = get_user_by_phone(phone_number)
            if not user:
                user = create_user(phone_number)
            
            # Generate access token
            access_token = generate_access_token(user.id)
            
            # Remove used OTP
            del pending_otps[phone_number]
            
            return {"access_token": access_token, "token_type": "bearer"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to create user session: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Invalid OTP")

@router.get("/me", response_model=User, summary="Get current user")
async def get_current_user(authorization: str = Header(None)):
    """
    Get current user information.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    try:
        token_type, token = authorization.split()
        if token_type.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    try:
        # Get user from database
        user_data = users_collection.find_one({"_id": user_id})
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data["id"] = str(user_data["_id"])
        del user_data["_id"]
        return User(**user_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve user: {str(e)}")