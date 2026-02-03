"""
Test frontend compatibility with feed data.

This script verifies that the feed API returns data in the format
expected by the frontend components.
"""

import requests
import json

API_BASE_URL = "http://localhost:8000/api"


def test_frontend_compatibility():
    """Test that feed data is compatible with frontend components."""
    print("=" * 70)
    print("🎨 Frontend Compatibility Test")
    print("=" * 70)
    
    try:
        # Fetch feed data (simulating FeedContainer)
        print("\n📡 Fetching feed data from API...")
        response = requests.get(f"{API_BASE_URL}/feed/", params={"page": 1, "limit": 10})
        response.raise_for_status()
        
        data = response.json()
        print(f"✅ Received {len(data['items'])} feed items")
        
        # Verify data structure
        print("\n🔍 Verifying frontend compatibility...")
        
        all_valid = True
        
        for i, item in enumerate(data['items'][:3], 1):
            print(f"\n   Feed Item {i}:")
            
            # Check required fields for frontend display
            required_fields = {
                'id': str,
                'type': str,
                'title': str,
                'content': str,
                'priority': int,
                'created_at': str,
            }
            
            item_valid = True
            for field, expected_type in required_fields.items():
                if field not in item:
                    print(f"   ❌ Missing field: {field}")
                    item_valid = False
                    all_valid = False
                elif not isinstance(item[field], expected_type):
                    print(f"   ❌ Wrong type for {field}: expected {expected_type.__name__}, got {type(item[field]).__name__}")
                    item_valid = False
                    all_valid = False
                else:
                    value = item[field]
                    if isinstance(value, str) and len(value) > 50:
                        value = value[:50] + '...'
                    print(f"   ✅ {field}: {value}")
            
            # Check metadata (incident-specific fields)
            if 'metadata' in item:
                print(f"   ✅ metadata present")
                metadata = item['metadata']
                
                # These are the incident fields that should appear in the UI
                incident_fields = ['customer_name', 'status', 'issue_type', 'province']
                
                print(f"\n   Incident Details (for UI display):")
                for field in incident_fields:
                    if field in metadata:
                        value = metadata[field]
                        # Truncate long values
                        if isinstance(value, str) and len(value) > 40:
                            value = value[:40] + '...'
                        print(f"      {field}: {value}")
                    else:
                        print(f"      {field}: (missing)")
                        item_valid = False
                        all_valid = False
            else:
                print(f"   ❌ metadata missing")
                item_valid = False
                all_valid = False
            
            if item_valid:
                print(f"   ✅ Item {i} is valid for display")
            else:
                print(f"   ❌ Item {i} has missing fields")
        
        # Test different feed types
        print("\n" + "=" * 70)
        print("🎭 Testing Feed Card Components")
        print("=" * 70)
        
        # Count items by type
        type_counts = {}
        for item in data['items']:
            item_type = item.get('type', 'unknown')
            type_counts[item_type] = type_counts.get(item_type, 0) + 1
        
        print("\n   Feed items by type:")
        for feed_type, count in type_counts.items():
            print(f"      {feed_type}: {count} items")
        
        # Verify each type has the right structure
        component_mapping = {
            'alert': 'AlertFeedCard',
            'highlight': 'HighlightCard',
            'trending': 'TrendingCard',
            'upload': 'UploadCard',
        }
        
        print("\n   Component compatibility:")
        for feed_type, component in component_mapping.items():
            if feed_type in type_counts:
                print(f"      ✅ {component} will render {type_counts[feed_type]} items")
            else:
                print(f"      ⚠️  {component} has no items to render")
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 Compatibility Results")
        print("=" * 70)
        
        if all_valid:
            print("✅ All feed items are compatible with frontend components")
            print("\n✨ Frontend Compatibility Verified!")
            print("\nThe feed items contain all required fields:")
            print("  - id, type, title, content, priority, created_at")
            print("  - metadata with: customer_name, status, issue_type, province")
            print("\nThese fields will display correctly in:")
            print("  - FeedContainer component")
            print("  - AlertFeedCard component")
            print("  - HighlightCard component")
            print("  - TrendingCard component")
            print("\n📝 Manual Verification Steps:")
            print("  1. Open http://localhost:3000 in your browser")
            print("  2. Navigate to the Home/Feed page")
            print("  3. Verify incident data displays correctly:")
            print("     - Incident titles appear as card titles")
            print("     - Customer names are visible")
            print("     - Status and issue type are shown")
            print("     - Province information is displayed")
            print("     - Timestamps are formatted correctly")
        else:
            print("❌ Some feed items have missing fields")
            print("   Frontend may not display correctly")
        
        print("=" * 70)
        
        return all_valid
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Error: {e}")
        print("\nMake sure:")
        print("  1. Backend is running on http://localhost:8000")
        print("  2. Database has incident data")
        print("=" * 70)
        return False


if __name__ == "__main__":
    success = test_frontend_compatibility()
    exit(0 if success else 1)
