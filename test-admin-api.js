const axios = require('axios');

const API_BASE_URL = process.env.VITE_BACKEND_URL ? `${process.env.VITE_BACKEND_URL}/api` : 'http://localhost:8000/api';

// Test admin credentials
const adminCredentials = {
    email: 'admin@example.com',
    password: 'admin123'
};

async function testAdminAPI() {
    try {
        console.log('🧪 Testing Admin API...\n');

        // 1. Login as admin
        console.log('1. Logging in as admin...');
        const loginResponse = await axios.post(`${API_BASE_URL}/login`, adminCredentials);
        const token = loginResponse.data.token;
        console.log('✅ Login successful\n');

        // Set up axios with auth header
        const apiClient = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // 2. Test get all users
        console.log('2. Testing get all users...');
        const usersResponse = await apiClient.get('/admin/users');
        console.log(`✅ Found ${usersResponse.data.data.length} users`);
        console.log(`   Pagination: ${usersResponse.data.pagination.current_page}/${usersResponse.data.pagination.last_page}\n`);

        // 3. Test get creators
        console.log('3. Testing get creators...');
        const creatorsResponse = await apiClient.get('/admin/users/creators');
        console.log(`✅ Found ${creatorsResponse.data.data.length} creators\n`);

        // 4. Test get brands
        console.log('4. Testing get brands...');
        const brandsResponse = await apiClient.get('/admin/users/brands');
        console.log(`✅ Found ${brandsResponse.data.data.length} brands\n`);

        // 5. Test get statistics
        console.log('5. Testing get statistics...');
        const statsResponse = await apiClient.get('/admin/users/statistics');
        console.log('✅ Statistics retrieved:');
        console.log(`   Total users: ${statsResponse.data.data.total_users}`);
        console.log(`   Creators: ${statsResponse.data.data.creators}`);
        console.log(`   Brands: ${statsResponse.data.data.brands}`);
        console.log(`   Premium users: ${statsResponse.data.data.premium_users}\n`);

        // 6. Test user actions (if there are users)
        if (usersResponse.data.data.length > 0) {
            const firstUser = usersResponse.data.data[0];
            console.log(`6. Testing user actions on user: ${firstUser.name || firstUser.company}...`);
            
            // Test activate (if user is not already active)
            if (!firstUser.email_verified_at) {
                console.log('   Testing activate user...');
                const activateResponse = await apiClient.patch(`/admin/users/${firstUser.id}/status`, {
                    action: 'activate'
                });
                console.log(`   ✅ ${activateResponse.data.message}`);
            }

            // Test block
            console.log('   Testing block user...');
            const blockResponse = await apiClient.patch(`/admin/users/${firstUser.id}/status`, {
                action: 'block'
            });
            console.log(`   ✅ ${blockResponse.data.message}`);

            // Test activate again
            console.log('   Testing activate user again...');
            const activateAgainResponse = await apiClient.patch(`/admin/users/${firstUser.id}/status`, {
                action: 'activate'
            });
            console.log(`   ✅ ${activateAgainResponse.data.message}\n`);
        }

        console.log('🎉 All admin API tests passed!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            console.log('\n💡 Make sure you have an admin user in the database:');
            console.log('   Run: php artisan db:seed');
        }
        
        if (error.response?.status === 403) {
            console.log('\n💡 Make sure the user has admin role:');
            console.log('   Check that admin@example.com has role = "admin"');
        }
    }
}

// Run the test
testAdminAPI(); 