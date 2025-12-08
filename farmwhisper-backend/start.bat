@echo off

REM Check if .env file exists, if not create it from .env.example
if not exist .env (
    echo Creating .env file from .env.example
    copy .env.example .env
    echo Please update the .env file with your actual values
)

REM Install dependencies
echo Installing Python dependencies...
pip install -r requirements.txt

REM Start the application
echo Starting FarmWhisper backend...
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause