// Simple API test script
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testAPI() {
  console.log('Testing Event Management API...\n');

  try {
    // Test 0: Test if server is responding
    console.log('0. Testing server connection...');
    try {
      const testResponse = await axios.get(`${API_URL}/test`);
      console.log('✓ Server is responding:', testResponse.data);
    } catch (error) {
      console.log('Server test failed:', error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
      }
    }

    // Test 1: Register a new user
    console.log('1. Testing user registration...');
    let token;
    try {
      const registerResponse = await axios.post(`${API_URL}/auth/register`, {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      });
      console.log('✓ User registered successfully');
      token = registerResponse.data.token;
      console.log('✓ Token received');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('Note: User already exists, trying login instead...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
          email: 'test@example.com',
          password: 'password123'
        });
        token = loginResponse.data.token;
        console.log('✓ Login successful, token received');
      } else {
        throw error;
      }
    }

    // Test 2: Login
    console.log('\n2. Testing login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('✓ Login successful');
    token = loginResponse.data.token; // Update token from login response

    // Test 3: Get current user
    console.log('\n3. Testing get current user...');
    const userResponse = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ Current user retrieved');

    // Test 4: Register an admin user
    console.log('\n4. Testing admin registration...');
    let adminToken;
    try {
      const adminResponse = await axios.post(`${API_URL}/auth/register`, {
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('✓ Admin registered successfully');
      adminToken = adminResponse.data.token;
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('Note: Admin already exists, trying login instead...');
        const adminLoginResponse = await axios.post(`${API_URL}/auth/login`, {
          email: 'admin@example.com',
          password: 'admin123'
        });
        adminToken = adminLoginResponse.data.token;
        console.log('✓ Admin login successful, token received');
      } else {
        throw error;
      }
    }

    // Test 5: Create an event (as admin)
    console.log('\n5. Testing event creation...');
    const eventResponse = await axios.post(`${API_URL}/events`, {
      title: 'Test Event',
      description: 'This is a test event',
      date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      location: 'Test Location',
      capacity: 100
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✓ Event created successfully');
    const eventId = eventResponse.data.event._id;

    // Test 6: Get all events
    console.log('\n6. Testing get all events...');
    const eventsResponse = await axios.get(`${API_URL}/events`);
    console.log(`✓ Retrieved ${eventsResponse.data.length} events`);

    // Test 7: Register for event (as user)
    console.log('\n7. Testing event registration...');
    await axios.post(`${API_URL}/events/${eventId}/register`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ Successfully registered for event');

    // Test 8: Get single event
    console.log('\n8. Testing get single event...');
    const singleEventResponse = await axios.get(`${API_URL}/events/${eventId}`);
    console.log('✓ Single event retrieved');
    console.log(`  Event: ${singleEventResponse.data.title}`);
    console.log(`  Registered: ${singleEventResponse.data.registeredCount}/${singleEventResponse.data.capacity}`);

    console.log('\n✅ All API tests passed successfully!');
    
  } catch (error) {
    console.error('\n❌ API test failed:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Message: ${error.response.data.message}`);
    } else {
      console.error(error.message);
    }
  }
}

// Run tests
testAPI();