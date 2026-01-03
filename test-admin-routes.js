const axios = require('axios');

const API_BASE = 'http://192.168.1.181:4000/api';

async function testAdminRoutes() {
  console.log('🧪 Testing Admin Dashboard Routes\n');

  try {
    // Test 1: Check if admin routes are registered
    console.log('1. Testing route registration...');
    const routes = [
      '/admin/stats',
      '/drivers/uk', 
      '/admin/pickups/pending',
      '/admin/deliveries/pending'
    ];

    for (const route of routes) {
      try {
        const url = `${API_BASE}${route}`;
        console.log(`   Testing: ${url}`);
        const res = await axios.get(url, {
          headers: { Authorization: 'Bearer invalid-token-for-testing' },
          validateStatus: () => true // Don't throw on any status
        });
        
        if (res.status === 401) {
          console.log(`   ✅ Route exists (401 Unauthorized - expected)`);
        } else if (res.status === 404) {
          console.log(`   ❌ Route not found (404)`);
        } else {
          console.log(`   ✅ Route exists (${res.status})`);
        }
      } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
      }
    }

    console.log('\n✅ Test complete!\n');
    console.log('Next steps:');
    console.log('1. Create admin user in MongoDB with bcrypt password');
    console.log('2. Test login at POST /api/admin/login');
    console.log('3. Use returned JWT token to test driver assignment');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAdminRoutes();
