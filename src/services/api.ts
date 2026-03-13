// API service for communicating with the FarmWhisper backend
const API_BASE_URL = 'http://localhost:8000';

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

// Voice processing – send audio blob to backend STT
export async function processVoiceQuery(audioBlob: Blob) {
  const formData = new FormData();
  formData.append('audio_file', audioBlob, 'recording.wav');
  formData.append('method', 'google');

  const response = await fetch(`${API_BASE_URL}/voice/query`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Voice processing failed with status ${response.status}`);
  }

  return await response.json();
  // Returns: { text, language, ai_response }
}

// Crop analysis – send image to Gemini via backend
export async function analyzeCropImage(imageBlob: Blob) {
  const formData = new FormData();
  formData.append('image', imageBlob, 'crop-image.jpg');

  const response = await fetch(`${API_BASE_URL}/crop/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Crop analysis failed with status ${response.status}`);
  }

  return await response.json();
  // Returns: { crop_name, crop_name_hindi, health_status, health_score, needs_water,
  //            issues, pest_risk, diseases, fertilizer_recommendation, remedy, recommendations }
}

// Get weather data by coordinates
export async function getWeatherData(lat: number, lon: number) {
  try {
    return await fetchAPI(`/weather/forecast?lat=${lat}&lon=${lon}`);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return {
      temperature: 28.5, humidity: 65, rain_probability: 30,
      description: 'Partly Cloudy', location: `${lat}, ${lon}`,
      wind_speed: 12, feels_like: 30.1,
    };
  }
}

// Get weather by location name
export async function getWeatherByLocation(location: string) {
  try {
    return await fetchAPI(`/weather/location?location=${encodeURIComponent(location)}`);
  } catch (error) {
    console.error('Error fetching weather by location:', error);
    return {
      temperature: 28.5, humidity: 65, rain_probability: 30,
      description: 'Partly Cloudy', location,
      wind_speed: 12, feels_like: 30.1,
    };
  }
}

// Generate story advisory
export async function generateAdvisory(cropType: string, analysisResult: any) {
  try {
    return await fetchAPI('/advice/story', {
      method: 'POST',
      body: JSON.stringify({ crop_type: cropType, analysis_result: analysisResult }),
    });
  } catch (error) {
    console.error('Error generating advisory:', error);
    return {
      story: `मिट्टी प्यास की गुहार लगाती है — पुरानी नदी के मोड़ से जल लाओ।`,
      tips: ['सुबह जल्दी सिंचाई करें', 'जैविक खाद डालें', 'कीटों की नियमित जाँच करें'],
    };
  }
}

// Community
export async function getCommunityPosts(limit: number = 10, offset: number = 0) {
  try {
    return await fetchAPI(`/community/?limit=${limit}&offset=${offset}`);
  } catch (error) {
    console.error('Error fetching community posts:', error);
    return [];
  }
}

export async function createCommunityPost(postData: any) {
  try {
    return await fetchAPI('/community/', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  } catch (error) {
    console.error('Error creating community post:', error);
    return { ...postData, id: 'mock-' + Date.now(), upvotes: 0, created_at: new Date().toISOString() };
  }
}

export async function upvoteCommunityPost(postId: string, userId: string) {
  try {
    return await fetchAPI('/community/upvote', {
      method: 'POST',
      body: JSON.stringify({ post_id: postId, user_id: userId }),
    });
  } catch (error) {
    console.error('Error upvoting community post:', error);
    return { message: 'Upvoted', upvotes: 1 };
  }
}

// TTS – browser uses Web Speech API; backend just echoes the text
export async function narrateStory(text: string) {
  try {
    return await fetchAPI('/tts/narrate', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  } catch (error) {
    return { text, language: 'hi-IN' };
  }
}