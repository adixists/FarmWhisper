# Running FarmWhisper - Complete Application

This guide explains how to run both the frontend and backend components of the FarmWhisper application together.

## Prerequisites

1. Node.js (version 14 or higher)
2. Python (version 3.9 or higher)
3. npm (comes with Node.js)

## Running the Complete Application

### Step 1: Start the Backend Server

1. Open a terminal/command prompt
2. Navigate to the backend directory:
   ```bash
   cd farmwhisper-backend
   ```
3. Start the backend server:
   ```bash
   python -m uvicorn app.simple_main:app --reload --host 0.0.0.0 --port 8000
   ```

The backend should now be running on http://localhost:8000

### Step 2: Start the Frontend Server

1. Open a new terminal/command prompt (keep the backend terminal running)
2. Navigate to the frontend directory (root of the project):
   ```bash
   cd FarmWhisper\ Mobile\ App\ UI
   ```
3. Install dependencies (if not already done):
   ```bash
   npm install
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

The frontend should now be running on http://localhost:3000

### Step 3: Access the Application

1. Open your web browser
2. Navigate to http://localhost:3000
3. You should see the FarmWhisper mobile app interface
4. The app will automatically connect to the backend at http://localhost:8000

## Verifying the Connection

1. When the app loads, you should see a status message at the top:
   - "Checking backend connection..." (initially)
   - "Backend is offline. Some features may not work." (if backend is not running)
   - The message will disappear if the backend is successfully connected

2. On the Home screen, you should see weather data loading from the backend

## API Endpoints

The backend provides the following endpoints:

- Health check: http://localhost:8000/health
- Test endpoint: http://localhost:8000/test
- API Documentation: http://localhost:8000/docs (Swagger UI)

## Troubleshooting

### Backend Not Starting

1. Make sure Python is installed and accessible from the command line
2. Make sure you have installed the required Python packages:
   ```bash
   pip install fastapi uvicorn python-multipart
   ```

### Frontend Not Connecting to Backend

1. Make sure both servers are running
2. Check that the backend is running on port 8000
3. Check the browser's developer console for any error messages
4. Make sure there are no firewall rules blocking the connection

### CORS Issues

The backend is configured to allow all origins for development. If you encounter CORS issues, check the backend's main.py file for CORS configuration.

## Stopping the Servers

To stop either server, press `Ctrl+C` in the respective terminal window.

## Development Notes

- The frontend uses Vite for hot reloading - changes to React components will automatically refresh the browser
- The backend uses Uvicorn with reload - changes to Python files will automatically restart the server
- API services are located in `src/services/api.ts`
- Backend API routes are defined in `farmwhisper-backend/app/routes/`