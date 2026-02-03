#!/usr/bin/env python3
"""
Quick test to verify new fields (product_group, receiver, incident_number, subject) 
are included in feed metadata.
"""

import requests
import json

def test_new_fields():
    """Test that new fields are present in feed metadata."""
    print("=" * 70)
    print("Testing New Feed Metadata Fields")
    print("=" * 70)
    
    # Fetch feed data
    api_url = "http://localhost:8000"
    response = requests.get(f"{api_url}/api/feed?limit=3")
    
    if response.status_code != 200:
        print(f"❌ Failed to fetch feed: {response.status_code}")
        return
    
    data = response.json()
    items = data.get("items", [])
    
    if not items:
        print("❌ No feed items found")
        return
    
    print(f"\n✅ Fetched {len(items)} feed items\n")
    
    # Check first item for new fields
    for i, item in enumerate(items, 1):
        print(f"Feed Item {i}:")
        print(f"  ID: {item['id']}")
        print(f"  Type: {item['type']}")
        print(f"  Title: {item['title'][:50]}...")
        
        # Parse metadata
        metadata = item.get('metadata', {})
        if isinstance(metadata, str):
            metadata = json.loads(metadata)
        
        print(f"\n  Metadata Fields:")
        
        # Check for new fields
        new_fields = ['product_group', 'receiver', 'incident_number', 'subject']
        for field in new_fields:
            value = metadata.get(field, 'NOT FOUND')
            status = "✅" if field in metadata else "❌"
            print(f"    {status} {field}: {value}")
        
        # Check existing fields
        print(f"\n  Existing Fields:")
        existing_fields = ['customer_name', 'status', 'issue_type', 'province']
        for field in existing_fields:
            value = metadata.get(field, 'NOT FOUND')
            status = "✅" if field in metadata else "❌"
            print(f"    {status} {field}: {value}")
        
        print("\n" + "-" * 70 + "\n")
    
    print("=" * 70)
    print("✅ Test Complete!")
    print("=" * 70)

if __name__ == "__main__":
    test_new_fields()
