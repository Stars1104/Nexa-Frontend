// Test script to verify subscription endpoint with authentication
import axios from 'axios';

async function testSubscription() {
  try {
    console.log('Testing subscription endpoint...');
    
    // First, let's try to get a token (you'll need to replace this with a real token)
    const token = localStorage.getItem('token') || 'your_token_here';
    
    if (token === 'your_token_here') {
      console.log('Please replace "your_token_here" with a real authentication token');
      return;
    }
    
    // Test subscription status endpoint
    const statusResponse = await axios.get('http://localhost:8000/api/payment/subscription-status', {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Subscription status response:', statusResponse.data);
    
    // Test subscription payment endpoint with test data
    const testPaymentData = {
      card_number: '4111111111111111',
      card_holder_name: 'Test User',
      card_expiration_date: '1225',
      card_cvv: '123',
      cpf: '111.444.777-35',
      test_mode: 'true' // Enable test mode
    };
    
    const paymentResponse = await axios.post('http://localhost:8000/api/payment/subscription', testPaymentData, {
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Payment response:', paymentResponse.data);
    
  } catch (error) {
    console.error('Error testing subscription:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.message);
    console.error('Data:', error.response?.data);
  }
}

testSubscription(); 