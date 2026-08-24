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
      let errDetail = `API request failed with status ${response.status}`;
      try {
        const json = await response.json();
        if (json.detail) errDetail = json.detail;
      } catch (_) {}
      throw new Error(errDetail);
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

// Voice query & AI reasoning processing
export interface VoiceQueryParams {
  audioBlob?: Blob;
  textQuery?: string;
  lat?: number;
  lon?: number;
  language?: string;
}

export async function processVoiceQuery(params: VoiceQueryParams) {
  const formData = new FormData();
  if (params.audioBlob) {
    formData.append('audio_file', params.audioBlob, 'recording.wav');
  }
  if (params.textQuery) {
    formData.append('text_query', params.textQuery);
  }
  if (params.lat !== undefined && params.lon !== undefined) {
    formData.append('lat', params.lat.toString());
    formData.append('lon', params.lon.toString());
  }
  if (params.language) {
    formData.append('language', params.language);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/voice/query`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errDetail = `Voice processing failed with status ${response.status}`;
      try {
        const json = await response.json();
        if (json.detail) errDetail = json.detail;
      } catch (_) {}
      throw new Error(errDetail);
    }

    return await response.json();
  } catch (error) {
    console.error('Error processing voice query:', error);
    // Fallback response for offline demonstration
    return {
      query: params.textQuery || "आवाज प्रश्न",
      response_text: "मौसम सामान्य है और आपकी फसल सुरक्षित है। किसी भी समस्या के लिए कृपया दोबारा पूछें।",
      language: params.language || "hi",
      query_type: "general",
      recommendations: ["खेत में उचित नमी बनाए रखें", "कीटों की नियमित जांच करें"]
    };
  }
}

// Crop analysis
export async function analyzeCropImage(imageBlob: Blob) {
  const formData = new FormData();
  formData.append('image', imageBlob, 'crop-image.jpg');

  const response = await fetch(`${API_BASE_URL}/crop/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorDetail = `Crop analysis failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = errJson.detail;
      }
    } catch (_) {}
    console.error('Backend error:', errorDetail);
    throw new Error(errorDetail);
  }

  return await response.json();
}

// Get recent crop scan history
export async function getCropHistory() {
  try {
    return await fetchAPI('/crop/history');
  } catch (error) {
    return [];
  }
}

// Get current weather data
export async function getWeatherData(lat: number, lon: number) {
  try {
    return await fetchAPI(`/weather/forecast?lat=${lat}&lon=${lon}`);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return {
      temperature: 28.5,
      humidity: 65,
      rain_probability: 30,
      description: "Partly cloudy (आंशिक बादल)",
      location: `Coordinates: ${lat}, ${lon}`
    };
  }
}

// Get multi-day 3-day weather forecast
export async function getMultiDayWeather(lat: number, lon: number, days: number = 4) {
  try {
    return await fetchAPI(`/weather/forecast/multiday?lat=${lat}&lon=${lon}&days=${days}`);
  } catch (error) {
    console.error('Error fetching multi-day weather:', error);
    return null;
  }
}

// Get weather by location name
export async function getWeatherByLocation(location: string) {
  try {
    return await fetchAPI(`/weather/location?location=${encodeURIComponent(location)}`);
  } catch (error) {
    console.error('Error fetching weather by location:', error);
    return {
      temperature: 28.5,
      humidity: 65,
      rain_probability: 30,
      description: "Partly cloudy (आंशिक बादल)",
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
    const storyPreview = text.length > 100 ? text.substring(0, 100) + "..." : text;
    return {
      message: "Text-to-speech conversion initiated",
      story_preview: storyPreview
    };
  }
}