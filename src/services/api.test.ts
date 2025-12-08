// Simple test to verify API connectivity
import { healthCheck, testEndpoint } from './api';

// Test the API connection
export async function testAPIConnection() {
  try {
    console.log('Testing API connection...');
    
    // Test health check
    const health = await healthCheck();
    console.log('Health check response:', health);
    
    // Test endpoint
    const test = await testEndpoint();
    console.log('Test endpoint response:', test);
    
    console.log('API connection test completed successfully!');
    return true;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
}

// Run the test if this file is executed directly
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  // Only run in development environment
  testAPIConnection();
}