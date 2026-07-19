# FarmWhisper - AI Voice & Vision Assistant for Farmers

FarmWhisper is a comprehensive backend API for an agricultural assistant mobile application that combines voice recognition, computer vision, and AI-powered advisory services to help farmers improve their crop yields and farming practices.

## Features

- **Voice Query Processing**: Convert spoken farmer questions to text using offline speech recognition
- **Crop Image Analysis**: Analyze crop health using computer vision techniques
- **Story-Based Advisory Generation**: Provide poetic, culturally relevant farming advice using lightweight LLMs
- **Weather Integration**: Get real-time weather forecasts from OpenWeatherMap
- **Community Platform**: Enable farmers to share tips and knowledge
- **Authentication**: Secure phone-based authentication with OTP
- **Database Storage**: MongoDB for storing user data, crop analyses, and community posts

## Tech Stack

- **Framework**: FastAPI (Python)
- **Database**: MongoDB
- **Voice Processing**: SpeechRecognition, Vosk (offline)
- **Computer Vision**: OpenCV
- **AI/ML**: Transformers (HuggingFace), TensorFlow Lite
- **Weather API**: OpenWeatherMap
- **Containerization**: Docker
- **Testing**: Pytest

## Prerequisites

- Python 3.8+
- MongoDB (local or cloud instance)
- OpenWeatherMap API key
- (Optional) Vosk offline speech recognition models

## Installation

### Option 1: Manual Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd farmwhisper-backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your actual values:
   - MongoDB connection string
   - OpenWeatherMap API key

5. Start the application:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Option 2: Docker Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd farmwhisper-backend
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your actual values.

3. Build and start with Docker Compose:
   ```bash
   docker-compose up --build
   ```

## API Endpoints

### Authentication
- `POST /auth/send-otp` - Send OTP to phone number
- `POST /auth/verify-otp` - Verify OTP and get access token
- `GET /auth/me` - Get current user information

### Voice Processing
- `POST /voice/query` - Process voice query from audio file

### Crop Analysis
- `POST /crop/analyze` - Analyze crop health from image

### Advisory Generation
- `POST /advice/story` - Generate story-based advisory

### Weather
- `GET /weather/forecast` - Get weather forecast by coordinates
- `GET /weather/location` - Get weather by location name

### Community
- `POST /community/` - Create a new post
- `GET /community/` - List community posts
- `GET /community/{post_id}` - Get a specific post
- `PUT /community/{post_id}` - Update a post
- `DELETE /community/{post_id}` - Delete a post
- `POST /community/upvote` - Upvote a post

## Example API Calls

### Send OTP
```bash
curl -X POST "http://localhost:8000/auth/send-otp?phone_number=+1234567890"
```

### Verify OTP
```bash
curl -X POST "http://localhost:8000/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+1234567890", "otp": "123456"}'
```

### Process Voice Query
```bash
curl -X POST "http://localhost:8000/voice/query" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "audio_file=@path/to/audio.wav" \
  -F "method=google"
```

### Analyze Crop Image
```bash
curl -X POST "http://localhost:8000/crop/analyze" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "image=@path/to/crop-image.jpg"
```

### Generate Advisory
```bash
curl -X POST "http://localhost:8000/advice/story" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "crop_type": "wheat",
    "analysis_result": {
      "health_score": 72,
      "pest_risk": "medium",
      "issues": ["low moisture", "yellow leaves"],
      "recommendations": ["increase watering", "apply nitrogen fertilizer"]
    }
  }'
```

### Get Weather Forecast
```bash
curl -X GET "http://localhost:8000/weather/forecast?lat=40.7128&lon=-74.0060" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Create Community Post
```bash
curl -X POST "http://localhost:8000/community/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "title": "Tips for Drought Resistance",
    "content": "Here are some proven techniques for farming during drought...",
    "tags": ["drought", "water conservation", "tips"]
  }'
```

## Testing

Run the test suite with pytest:

```bash
pytest app/tests/ -v
```

## Deployment

### Cloud Platforms

#### Render
1. Fork the repository to your GitHub account
2. Create a new Web Service on Render
3. Connect it to your repository
4. Set environment variables in the Render dashboard
5. Deploy!

#### Railway
1. Install the Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Deploy: `railway up`

#### Azure Student Tier
1. Create an Azure account (free for students)
2. Create a Web App resource
3. Configure deployment from your Git repository
4. Set environment variables in the Application Settings

## Project Structure

```
farmwhisper-backend/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── models/              # Data models and database integration
│   ├── routes/              # API route handlers
│   ├── services/            # Business logic implementations
│   └── tests/               # Unit tests
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore file
├── Dockerfile               # Docker configuration
├── docker-compose.yml       # Docker Compose configuration
├── requirements.txt         # Python dependencies
├── start.sh                 # Linux/Mac startup script
└── start.bat                # Windows startup script
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenWeatherMap for weather data
- HuggingFace for transformer models
- MongoDB for database services
- The open-source community for various libraries and tools