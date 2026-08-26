@echo off
title FarmWhisper App Launcher
echo ======================================================
echo           Starting FarmWhisper App
echo ======================================================
echo.

echo Starting Backend Server on http://localhost:8000 ...
start "FarmWhisper Backend" cmd /k "cd /d %~dp0farmwhisper-backend && venv\Scripts\activate && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo Starting Frontend Dev Server on http://localhost:3000 ...
start "FarmWhisper Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ======================================================
echo FarmWhisper Backend and Frontend have been launched!
echo Keep the opened windows open while using the app.
echo Access Frontend at: http://localhost:3000
echo ======================================================
pause
