// Test script for subscription payment
const axios = require('axios');

const API_BASE = 'http://localhost:8000/api';

async function testSubscription() {
  try {
    // Test data
    const testData = {
      card_number: '4111111111111111',
      card_holder_name: 'John Doe',
      card_expiration_date: '1230',
      card_cvv: '123',
      cpf: '111.444.777-35' // Valid CPF for testing
    };

    console.log('Testing subscription payment...');
    console.log('Test data:', testData);

    // Test without authentication (should fail with 401)
    console.log('\n1. Testing without authentication...');
    try {
      const response = await axios.post(`${API_BASE}/payment/subscription`, testData);
      console.log('✅ Unexpected success:', response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly failed with 401 (authentication required)');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }

    // Test with invalid token (should fail with 401)
    console.log('\n2. Testing with invalid token...');
    try {
      const response = await axios.post(`${API_BASE}/payment/subscription`, testData, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
      console.log('✅ Unexpected success:', response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly failed with 401 (invalid token)');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }

    // Test with valid token (if you have one)
    console.log('\n3. Testing with valid token...');
    console.log('Note: You need to provide a valid token to test this');
    console.log('To get a token, log in through the frontend and check localStorage');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testSubscription(); 