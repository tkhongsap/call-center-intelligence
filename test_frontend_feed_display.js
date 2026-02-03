/**
 * Test script to verify frontend feed display
 * 
 * This script simulates what the frontend does:
 * 1. Fetches feed data from the API
 * 2. Verifies the data structure
 * 3. Checks that all incident fields are present
 */

const API_BASE_URL = 'http://localhost:8000/api';

async function testFrontendFeedDisplay() {
    console.log('='.repeat(70));
    console.log('🎨 Frontend Feed Display Test');
    console.log('='.repeat(70));
    
    try {
        // Fetch feed data (simulating what FeedContainer does)
        console.log('\n📡 Fetching feed data from API...');
        const response = await fetch(`${API_BASE_URL}/feed/?page=1&limit=10`);
        
        if (!response.ok) {
            throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`✅ Received ${data.items.length} feed items`);
        
        // Verify data structure (what the frontend expects)
        console.log('\n🔍 Verifying feed item structure...');
        
        let allValid = true;
        
        for (let i = 0; i < Math.min(3, data.items.length); i++) {
            const item = data.items[i];
            console.log(`\n   Feed Item ${i + 1}:`);
            
            // Check required fields for display
            const requiredFields = {
                'id': item.id,
                'type': item.type,
                'title': item.title,
                'content': item.content,
                'priority': item.priority,
                'created_at': item.created_at,
            };
            
            let itemValid = true;
            for (const [field, value] of Object.entries(requiredFields)) {
                if (value === undefined || value === null) {
                    console.log(`   ❌ Missing field: ${field}`);
                    itemValid = false;
                    allValid = false;
                } else {
                    console.log(`   ✅ ${field}: ${typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : value}`);
                }
            }
            
            // Check metadata (incident-specific fields)
            if (item.metadata) {
                console.log(`   ✅ metadata present`);
                const metadata = item.metadata;
                
                // These are the incident fields that should appear in the UI
                const incidentFields = {
                    'customer_name': metadata.customer_name,
                    'status': metadata.status,
                    'issue_type': metadata.issue_type,
                    'province': metadata.province,
                };
                
                console.log(`\n   Incident Details (for UI display):`);
                for (const [field, value] of Object.entries(incidentFields)) {
                    if (value) {
                        console.log(`      ${field}: ${value}`);
                    } else {
                        console.log(`      ${field}: (missing)`);
                        itemValid = false;
                        allValid = false;
                    }
                }
            } else {
                console.log(`   ❌ metadata missing`);
                itemValid = false;
                allValid = false;
            }
            
            if (itemValid) {
                console.log(`   ✅ Item ${i + 1} is valid for display`);
            } else {
                console.log(`   ❌ Item ${i + 1} has missing fields`);
            }
        }
        
        // Summary
        console.log('\n' + '='.repeat(70));
        console.log('📊 Test Results');
        console.log('='.repeat(70));
        
        if (allValid) {
            console.log('✅ All feed items are valid for frontend display');
            console.log('\n✨ Frontend Compatibility Verified!');
            console.log('\nThe feed items contain all required fields:');
            console.log('  - id, type, title, content, priority, created_at');
            console.log('  - metadata with: customer_name, status, issue_type, province');
            console.log('\nThese fields will display correctly in:');
            console.log('  - FeedContainer component');
            console.log('  - AlertFeedCard component');
            console.log('  - HighlightCard component');
            console.log('  - TrendingCard component');
        } else {
            console.log('❌ Some feed items have missing fields');
            console.log('   Frontend may not display correctly');
        }
        
        console.log('='.repeat(70));
        
        return allValid;
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.log('\nMake sure:');
        console.log('  1. Backend is running on http://localhost:8000');
        console.log('  2. Database has incident data');
        console.log('='.repeat(70));
        return false;
    }
}

// Run the test
testFrontendFeedDisplay().then(success => {
    process.exit(success ? 0 : 1);
});
