// Test file to verify API service is working with mock data
import { getWeatherByLocation, getCommunityPosts } from './api';

// Test the API service
export async function testAPIService() {
  try {
    console.log('Testing API service with mock data...');
    
    // Test weather endpoint (should return mock data)
    const weather = await getWeatherByLocation('Delhi');
    console.log('Weather data:', weather);
    
    // Test community posts endpoint (should return mock data)
    const posts = await getCommunityPosts(5, 0);
    console.log('Community posts:', posts);
    
    console.log('API service test completed successfully!');
    return true;
  } catch (error) {
    console.error('API service test failed:', error);
    return false;
  }
}

// Run the test
testAPIService();