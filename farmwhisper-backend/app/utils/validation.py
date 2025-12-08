import re
from typing import Optional
from app.utils.exceptions import ValidationException

def validate_phone_number(phone_number: str) -> bool:
    """
    Validate phone number format.
    Supports international format with + and 10-15 digits.
    """
    pattern = r'^\+[1-9]\d{1,14}$'
    return bool(re.match(pattern, phone_number))

def validate_email(email: str) -> bool:
    """
    Validate email format.
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_image_file(filename: str) -> bool:
    """
    Validate image file extension.
    """
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'}
    return any(filename.lower().endswith(ext) for ext in allowed_extensions)

def validate_audio_file(filename: str) -> bool:
    """
    Validate audio file extension.
    """
    allowed_extensions = {'.wav', '.mp3', '.ogg', '.flac', '.aac', '.m4a'}
    return any(filename.lower().endswith(ext) for ext in allowed_extensions)

def validate_file_size(file_size: int, max_size_mb: int = 10) -> bool:
    """
    Validate file size.
    """
    max_size_bytes = max_size_mb * 1024 * 1024
    return file_size <= max_size_bytes

def validate_crop_health_score(score: int) -> bool:
    """
    Validate crop health score (0-100).
    """
    return 0 <= score <= 100

def validate_pest_risk(risk: str) -> bool:
    """
    Validate pest risk level.
    """
    valid_risks = {'low', 'medium', 'high'}
    return risk.lower() in valid_risks