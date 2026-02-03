"""
Test script for feed integration with real incident data.

This script:
1. Uploads incident data to the database
2. Tests the /api/feed endpoint
3. Verifies incident data is transformed correctly
4. Checks all required fields are present

Usage:
    python test_feed_integration.py
"""

import requests
import json
from pathlib import Path
from typing import Dict, Any, List

# Configuration
API_BASE_URL = "http://localhost:8000/api"
EXCEL_FILE_PATH = "../sample_data/Incident_Exported_20260127_155320.xlsx"


def test_api_health():
    """Test if API is running."""
    try:
        response = requests.get(f"{API_BASE_URL.replace('/api', '')}/health")
        if response.status_code == 200:
            print("✅ API is running")
            return True
        else:
            print(f"❌ API health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API. Is the server running?")
        print("   Start with: cd call_center_intelligence_backend && python main.py")
        return False


def upload_incidents():
    """Upload incident data to database."""
    file_path = Path(EXCEL_FILE_PATH)
    if not file_path.exists():
        print(f"❌ Sample data file not found: {file_path}")
        return None
    
    print(f"\n📤 Uploading incidents from: {file_path.name}")
    
    url = f"{API_BASE_URL}/incidents/upload"
    with open(file_path, "rb") as f:
        files = {"file": (file_path.name, f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        
        try:
            response = requests.post(url, files=files)
            response.raise_for_status()
            
            result = response.json()
            print(f"✅ Upload successful!")
            print(f"   Total rows: {result['total_rows']}")
            print(f"   Success: {result['success_count']}")
            print(f"   Errors: {result['error_count']}")
            
            return result['upload_id']
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Upload failed: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"   Response: {e.response.text}")
            return None


def test_feed_endpoint():
    """Test the /api/feed endpoint."""
    print(f"\n🔍 Testing /api/feed endpoint...")
    
    url = f"{API_BASE_URL}/feed/"
    
    try:
        response = requests.get(url, params={"page": 1, "limit": 10})
        response.raise_for_status()
        
        data = response.json()
        
        print(f"✅ Feed endpoint working")
        print(f"   Total items: {data['pagination']['total']}")
        print(f"   Items returned: {len(data['items'])}")
        
        return data
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Feed endpoint failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"   Response: {e.response.text}")
        return None


def verify_feed_item_structure(item: Dict[str, Any]) -> List[str]:
    """Verify a feed item has all required fields."""
    errors = []
    
    # Required fields from FeedItemResponse schema
    required_fields = {
        'id': str,
        'type': str,
        'title': str,
        'content': str,
        'priority': int,
        'created_at': str,
    }
    
    for field, expected_type in required_fields.items():
        if field not in item:
            errors.append(f"Missing field: {field}")
        elif not isinstance(item[field], expected_type):
            errors.append(f"Field {field} has wrong type: expected {expected_type.__name__}, got {type(item[field]).__name__}")
    
    # Check metadata contains incident fields
    if 'metadata' in item:
        metadata = item['metadata']
        incident_fields = ['customer_name', 'status', 'issue_type', 'province']
        for field in incident_fields:
            if field not in metadata:
                errors.append(f"Missing metadata field: {field}")
    else:
        errors.append("Missing metadata")
    
    # Verify content is not empty
    if item.get('content') == '':
        errors.append("Content is empty")
    
    # Verify title is not empty
    if item.get('title') == '':
        errors.append("Title is empty")
    
    return errors


def test_feed_item_display(items: List[Dict[str, Any]]):
    """Test that feed items display correctly."""
    print(f"\n🎨 Verifying feed item display...")
    
    if not items:
        print("⚠️  No feed items to verify")
        return False
    
    all_valid = True
    
    for idx, item in enumerate(items[:5], 1):  # Check first 5 items
        print(f"\n   Item {idx}:")
        print(f"   ID: {item.get('id', 'MISSING')}")
        print(f"   Type: {item.get('type', 'MISSING')}")
        print(f"   Title: {item.get('title', 'MISSING')[:50]}...")
        print(f"   Priority: {item.get('priority', 'MISSING')}")
        
        # Verify structure
        errors = verify_feed_item_structure(item)
        
        if errors:
            print(f"   ❌ Validation errors:")
            for error in errors:
                print(f"      - {error}")
            all_valid = False
        else:
            print(f"   ✅ All fields present and valid")
            
            # Display metadata
            metadata = item.get('metadata', {})
            print(f"   Customer: {metadata.get('customer_name', 'N/A')}")
            print(f"   Status: {metadata.get('status', 'N/A')}")
            print(f"   Issue Type: {metadata.get('issue_type', 'N/A')}")
            print(f"   Province: {metadata.get('province', 'N/A')}")
    
    return all_valid


def test_feed_filtering():
    """Test feed filtering by type."""
    print(f"\n🔍 Testing feed filtering...")
    
    url = f"{API_BASE_URL}/feed/"
    
    # Test alert filter
    try:
        response = requests.get(url, params={"type": "alert", "page": 1, "limit": 5})
        response.raise_for_status()
        data = response.json()
        
        alert_count = len(data['items'])
        print(f"   Alert items: {alert_count}")
        
        # Verify all items are alerts
        non_alerts = [item for item in data['items'] if item['type'] != 'alert']
        if non_alerts:
            print(f"   ❌ Found {len(non_alerts)} non-alert items in alert filter")
            return False
        else:
            print(f"   ✅ Alert filter working correctly")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Filter test failed: {e}")
        return False


def test_feed_pagination():
    """Test feed pagination."""
    print(f"\n📄 Testing feed pagination...")
    
    url = f"{API_BASE_URL}/feed/"
    
    try:
        # Get first page
        response1 = requests.get(url, params={"page": 1, "limit": 5})
        response1.raise_for_status()
        page1 = response1.json()
        
        # Get second page
        response2 = requests.get(url, params={"page": 2, "limit": 5})
        response2.raise_for_status()
        page2 = response2.json()
        
        # Verify different items
        page1_ids = {item['id'] for item in page1['items']}
        page2_ids = {item['id'] for item in page2['items']}
        
        overlap = page1_ids & page2_ids
        
        if overlap:
            print(f"   ❌ Pages have overlapping items: {overlap}")
            return False
        else:
            print(f"   ✅ Pagination working correctly")
            print(f"      Page 1: {len(page1['items'])} items")
            print(f"      Page 2: {len(page2['items'])} items")
            return True
        
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Pagination test failed: {e}")
        return False


def main():
    """Main test execution."""
    print("=" * 70)
    print("🧪 Feed Integration Test Suite")
    print("=" * 70)
    
    # Check API health
    if not test_api_health():
        print("\n❌ Cannot proceed without running API")
        return
    
    # Upload incidents
    print("\n" + "=" * 70)
    print("Step 1: Load Incidents into Database")
    print("=" * 70)
    
    upload_id = upload_incidents()
    if not upload_id:
        print("\n⚠️  Skipping upload (may already have data)")
    
    # Test feed endpoint
    print("\n" + "=" * 70)
    print("Step 2: Test Feed Endpoint")
    print("=" * 70)
    
    feed_data = test_feed_endpoint()
    if not feed_data:
        print("\n❌ Feed endpoint test failed")
        return
    
    # Verify feed item display
    print("\n" + "=" * 70)
    print("Step 3: Verify Feed Item Display")
    print("=" * 70)
    
    items_valid = test_feed_item_display(feed_data['items'])
    
    # Test filtering
    print("\n" + "=" * 70)
    print("Step 4: Test Feed Filtering")
    print("=" * 70)
    
    filter_works = test_feed_filtering()
    
    # Test pagination
    print("\n" + "=" * 70)
    print("Step 5: Test Feed Pagination")
    print("=" * 70)
    
    pagination_works = test_feed_pagination()
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 Test Summary")
    print("=" * 70)
    
    results = {
        "Feed endpoint": feed_data is not None,
        "Item structure": items_valid,
        "Filtering": filter_works,
        "Pagination": pagination_works,
    }
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"   {test_name}: {status}")
    
    all_passed = all(results.values())
    
    print("\n" + "=" * 70)
    if all_passed:
        print("✅ All tests passed! Feed integration is working correctly.")
        print("\nNext steps:")
        print("1. Open the frontend at http://localhost:3000")
        print("2. Navigate to the Home/Feed page")
        print("3. Verify incident data displays correctly in the UI")
    else:
        print("❌ Some tests failed. Please review the errors above.")
    print("=" * 70)


if __name__ == "__main__":
    main()
