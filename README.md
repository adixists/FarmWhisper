# FarmWhisper

FarmWhisper is an AI Voice & Vision Assistant for Farmers, designed to help agricultural communities with crop analysis, weather forecasting, and community knowledge sharing.

![FarmWhisper Demo](https://placehold.co/800x400?text=FarmWhisper+Demo+Screenshot)

## 🌟 Key Features

### 📸 Crop Image Analysis
- Upload crop photos for AI-powered analysis
- Get detailed health scores and issue identification
- Receive actionable treatment recommendations

### 🎙️ Voice-Based Queries
- Hands-free farming assistance through voice commands
- Natural language processing for intuitive interactions
- Immediate responses to farming questions

### 📖 Story-Based Advisory
- AI-generated farming wisdom in engaging story format
- Play/Pause functionality for story narration
- Progress tracking with visual indicators

### ☀️ Weather Forecasting
- Location-based weather predictions
- Critical alerts for farming decisions
- Integration with agricultural calendars

### 👥 Community Platform
- Knowledge sharing among farming communities
- Upvoting system for valuable contributions
- Collaborative problem-solving

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for responsive styling
- **Radix UI** components for accessibility
- **Vite** for fast development

### Backend
- **Python FastAPI** for high-performance APIs
- **TensorFlow** for image analysis
- **MongoDB** for data persistence
- **SpeechRecognition** for voice processing

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Python (v3.9 or higher)
- MongoDB (for production)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/adixists/FarmWhisper.git
cd FarmWhisper
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd farmwhisper-backend
pip install -r requirements.txt
```

### Running the Application

#### Start the Backend Server
```bash
cd farmwhisper-backend
python -m uvicorn app.simple_main:app --reload --host 0.0.0.0 --port 8000
```

#### Start the Frontend Server
```bash
# In a new terminal, from the root directory
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 📁 Project Structure

```
FarmWhisper/
├── src/                    # Frontend React components
│   ├── components/         # UI components for each screen
│   ├── services/           # API service layer
│   └── figma/             # Image components
├── farmwhisper-backend/    # Python FastAPI backend
│   ├── app/
│   │   ├── main.py        # Main FastAPI application
│   │   ├── routes/        # API route handlers
│   │   ├── services/      # Business logic
│   │   └── models/        # Data models
│   └── requirements.txt   # Python dependencies
├── README.md              # This file
└── RUNNING.md            # Detailed running instructions
```

## 🔄 API Endpoints

| Endpoint | Method | Description |
|---------|--------|-------------|
| `/voice/query` | POST | Process voice queries |
| `/crop/analyze` | POST | Analyze crop images |
| `/advice/story` | POST | Generate story-based advisories |
| `/weather/forecast` | GET | Get weather by coordinates |
| `/weather/location` | GET | Get weather by location name |
| `/community/` | GET/POST | List/create community posts |
| `/community/upvote` | POST | Upvote posts |
| `/tts/narrate` | POST | Convert text to speech |

## 🧪 Testing

### Frontend Tests
```bash
npm test
```

### Backend Tests
```bash
cd farmwhisper-backend
pytest
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to all contributors who have helped shape FarmWhisper
- Inspired by the need to empower farming communities with technology