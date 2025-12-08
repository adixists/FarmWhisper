class FarmWhisperException(Exception):
    """Base exception class for FarmWhisper application"""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class AuthenticationException(FarmWhisperException):
    """Exception raised for authentication errors"""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, 401)

class AuthorizationException(FarmWhisperException):
    """Exception raised for authorization errors"""
    def __init__(self, message: str = "Access denied"):
        super().__init__(message, 403)

class NotFoundException(FarmWhisperException):
    """Exception raised when a resource is not found"""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, 404)

class ValidationException(FarmWhisperException):
    """Exception raised for validation errors"""
    def __init__(self, message: str = "Validation failed"):
        super().__init__(message, 400)

class ExternalServiceException(FarmWhisperException):
    """Exception raised when an external service fails"""
    def __init__(self, message: str = "External service error"):
        super().__init__(message, 502)