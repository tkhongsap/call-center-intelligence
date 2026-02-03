#!/usr/bin/env python3
"""Test cases API with incident data"""

import requests
import json

def test_cases_api():
    api_url = "http://localhost:8000"
    
    print("=" * 70)
    print("Testing Cases API with Incident Data")
    print("=" * 70)
    
    # Test 1: Get cases list
    print("\n1. Testing GET /api/cases")
    response = requests.get(f"{api_url}/api/cases?page=1&limit=5")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Success! Retrieved {len(data['cases'])} cases")
        print(f"   Total: {data['pagination']['total']}")
        print(f"   Total Pages: {data['pagination']['total_pages']}")
        
        if data['cases']:
            case = data['cases'][0]
            print(f"\n   Sample Case:")
            print(f"     ID: {case['id']}")
            print(f"     Case Number: {case['case_number']}")
            print(f"     Status: {case['status']}")
            print(f"     Severity: {case['severity']}")
            print(f"     Category: {case['category']}")
            print(f"     Business Unit: {case['business_unit']}")
            print(f"     Customer: {case.get('customer_name', 'N/A')}")
    else:
        print(f"❌ Failed: {response.status_code}")
        print(response.text)
    
    # Test 2: Get case stats
    print("\n2. Testing GET /api/cases/stats")
    response = requests.get(f"{api_url}/api/cases/stats")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Success! Case Statistics:")
        print(f"   Total: {data['total']}")
        print(f"   By Status:")
        print(f"     Open: {data['by_status']['open']}")
        print(f"     In Progress: {data['by_status']['in_progress']}")
        print(f"     Resolved: {data['by_status']['resolved']}")
        print(f"     Closed: {data['by_status']['closed']}")
        print(f"   By Severity:")
        print(f"     Critical: {data['by_severity']['critical']}")
        print(f"     High: {data['by_severity']['high']}")
        print(f"     Medium: {data['by_severity']['medium']}")
        print(f"     Low: {data['by_severity']['low']}")
    else:
        print(f"❌ Failed: {response.status_code}")
        print(response.text)
    
    # Test 3: Get single case
    print("\n3. Testing GET /api/cases/{case_id}")
    response = requests.get(f"{api_url}/api/cases?page=1&limit=1")
    if response.status_code == 200:
        data = response.json()
        if data['cases']:
            case_id = data['cases'][0]['id']
            response = requests.get(f"{api_url}/api/cases/{case_id}")
            
            if response.status_code == 200:
                case = response.json()
                print(f"✅ Success! Retrieved case details:")
                print(f"   Case Number: {case['case_number']}")
                print(f"   Summary: {case['summary'][:50]}...")
                print(f"   Status: {case['status']}")
                print(f"   Created: {case['created_at']}")
            else:
                print(f"❌ Failed: {response.status_code}")
                print(response.text)
    
    print("\n" + "=" * 70)
    print("✅ Cases API Test Complete!")
    print("=" * 70)

if __name__ == "__main__":
    test_cases_api()
