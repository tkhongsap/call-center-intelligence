#!/usr/bin/env python3
"""Check feed pagination response"""

import requests
import json

def check_pagination():
    api_url = "http://localhost:8000"
    
    print("Checking page 1...")
    response = requests.get(f"{api_url}/api/feed?page=1&limit=10")
    
    if response.status_code != 200:
        print(f"Error: {response.status_code}")
        return
    
    data = response.json()
    
    print(f"\nPage 1 Response:")
    print(f"  Items returned: {len(data['items'])}")
    print(f"  Pagination info:")
    print(json.dumps(data['pagination'], indent=4))
    
    total_pages_key = 'totalPages' if 'totalPages' in data['pagination'] else 'total_pages'
    total_pages = data['pagination'].get(total_pages_key, 1)
    
    print(f"\n  hasMore should be: {data['pagination']['page']} < {total_pages} = {data['pagination']['page'] < total_pages}")
    
    if total_pages > 1:
        print("\n\nChecking page 2...")
        response2 = requests.get(f"{api_url}/api/feed?page=2&limit=10")
        data2 = response2.json()
        print(f"  Items returned: {len(data2['items'])}")
        print(f"  First item ID: {data2['items'][0]['id'] if data2['items'] else 'None'}")

if __name__ == "__main__":
    check_pagination()
