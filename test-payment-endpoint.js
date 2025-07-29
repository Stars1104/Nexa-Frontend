// Test script to verify payment endpoint
import axios from 'axios';

async function testPaymentEndpoint() {
  try {
    console.log('Testing payment endpoint...');
    
    const response = await axios.get('http://localhost:8000/api/payment/subscription-status', {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
  } catch (error) {
    console.error('Error testing payment endpoint:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.message);
    console.error('Data:', error.response?.data);
  }
}

testPaymentEndpoint(); 