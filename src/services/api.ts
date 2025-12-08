// API service for communicating with the FarmWhisper backend
const API_BASE_URL = 'http://localhost:8000';

// Generic fetch function with error handling
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
}

// Health check
export async function healthCheck() {
  return fetchAPI('/health');
}

// Test endpoint
export async function testEndpoint() {
  return fetchAPI('/test');
}

// Voice processing
export async function processVoiceQuery(audioBlob: Blob) {
  const formData = new FormData();
  formData.append('audio_file', audioBlob, 'recording.wav');
  formData.append('method', 'google');

  try {
    const response = await fetch(`${API_BASE_URL}/voice/query`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Voice processing failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error processing voice query:', error);
    // Return mock data for demonstration
    return {
      text: "This is a mock voice transcription. In a full implementation, this would be the actual transcription of your voice query.",
      language: "en"
    };
  }
}

// Crop analysis
export async function analyzeCropImage(imageBlob: Blob) {
  const formData = new FormData();
  formData.append('image', imageBlob, 'crop-image.jpg');

  try {
    const response = await fetch(`${API_BASE_URL}/crop/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Crop analysis failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error analyzing crop image:', error);
    // Return mock data for demonstration
    return {
      health_score: 72,
      pest_risk: "medium",
      issues: ["low moisture", "yellow leaves"],
      recommendations: [
        "Increase watering frequency",
        "Apply nitrogen-rich fertilizer",
        "Monitor for pest activity"
      ]
    };
  }
}

// Get weather data
export async function getWeatherData(lat: number, lon: number) {
  try {
    return await fetchAPI(`/weather/forecast?lat=${lat}&lon=${lon}`);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    // Return mock data for demonstration
    return {
      temperature: 28.5,
      humidity: 65,
      rain_probability: 30,
      description: "Partly cloudy",
      location: `Coordinates: ${lat}, ${lon}`
    };
  }
}

// Get weather by location name
export async function getWeatherByLocation(location: string) {
  try {
    return await fetchAPI(`/weather/location?location=${encodeURIComponent(location)}`);
  } catch (error) {
    console.error('Error fetching weather by location:', error);
    // Return mock data for demonstration
    return {
      temperature: 28.5,
      humidity: 65,
      rain_probability: 30,
      description: "Partly cloudy",
      location: location
    };
  }
}

// Generate advisory
export async function generateAdvisory(cropType: string, analysisResult: any) {
  const body = JSON.stringify({
    crop_type: cropType,
    analysis_result: analysisResult,
  });

  try {
    return await fetchAPI('/advice/story', {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error generating advisory:', error);
    // Return mock data for demonstration
    return {
      story: `The soil hums of thirst — calling for the old river's memory. Like a wise grandmother, your ${cropType} whispers of balance - neither too much nor too little. The golden sun smiles upon your fields, promising abundance to those who listen to nature's rhythm.`,
      tips: [
        "Water your crops in the early morning",
        "Apply organic compost",
        "Monitor for pests regularly"
      ]
    };
  }
}

// Community functions
export async function getCommunityPosts(limit: number = 10, offset: number = 0) {
  try {
    return await fetchAPI(`/community/?limit=${limit}&offset=${offset}`);
  } catch (error) {
    console.error('Error fetching community posts:', error);
    // Return mock data for demonstration
    return [
      {
        id: "1",
        user_id: "user1",
        title: "Traditional Rain Prediction Method",
        content: "My grandmother always said: when peacocks dance and frogs croak loudly, rain is coming in 24 hours. This has helped me plan my farming activities for decades!",
        upvotes: 42,
        created_at: "2025-11-27T10:30:00Z",
        tags: ["traditional knowledge", "weather prediction"]
      },
      {
        id: "2",
        user_id: "user2",
        title: "Natural Pest Control",
        content: "Neem oil spray works wonders! Mix 2 tablespoons of neem oil with 1 liter of water and a few drops of dish soap. Spray on plants in the evening to avoid burning leaves.",
        upvotes: 38,
        created_at: "2025-11-26T14:15:00Z",
        tags: ["pest control", "organic farming"]
      },
      {
        id: "3",
        user_id: "user3",
        title: "Soil Health Improvement",
        content: "Cow dung + wood ash + water = excellent fertilizer. Let it sit for a week, then dilute 1:10 before applying to crops. My wheat yield increased by 30% last season!",
        upvotes: 56,
        created_at: "2025-11-25T09:45:00Z",
        tags: ["soil health", "fertilizer"]
      }
    ];
  }
}

export async function createCommunityPost(postData: any) {
  try {
    return await fetchAPI('/community/', {
      method: 'POST',
      body: JSON.stringify(postData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error creating community post:', error);
    // Return mock data for demonstration
    return {
      ...postData,
      id: "mock-" + Date.now(),
      upvotes: 0,
      created_at: new Date().toISOString()
    };
  }
}

export async function upvoteCommunityPost(postId: string, userId: string) {
  try {
    return await fetchAPI('/community/upvote', {
      method: 'POST',
      body: JSON.stringify({ post_id: postId, user_id: userId }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error upvoting community post:', error);
    // Return mock data for demonstration
    return {
      message: "Post upvoted successfully",
      upvotes: Math.floor(Math.random() * 100) + 1
    };
  }
}

// Text-to-speech for story narration
export async function narrateStory(text: string) {
  const body = JSON.stringify({ text });

  try {
    return await fetchAPI('/tts/narrate', {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error narrating story:', error);
    // Return mock data for demonstration
    const storyPreview = text.length > 100 ? text.substring(0, 100) + "..." : text;
    return {
      message: "Text-to-speech conversion initiated",
      story_preview: storyPreview
    };
  }
}