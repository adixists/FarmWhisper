#!/bin/bash

# Exit on any error
set -e

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example"
    cp .env.example .env
    echo "Please update the .env file with your actual values"
fi

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Start the application
echo "Starting FarmWhisper backend..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload