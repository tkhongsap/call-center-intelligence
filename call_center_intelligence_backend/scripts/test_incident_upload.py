"""
Test script for incident upload endpoint.

Usage:
    python scripts/test_incident_upload.py
"""

import requests
from pathlib import Path

# Configuration
API_BASE_URL = "http://localhost:8000/api"
EXCEL_FILE_PATH = "../sample_data/Incident_Exported_20260127_155320.xlsx"


def upload_incident_file(file_path: str):
    """Upload incident Excel file to the API."""
    url = f"{API_BASE_URL}/incidents/upload"
    
    # Check if file exists
    file_path = Path(file_path)
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        return
    
    print(f"📤 Uploading file: {file_path.name}")
    
    # Prepare file for upload
    with open(file_path, "rb") as f:
        files = {"file": (file_path.name, f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        
        try:
            response = requests.post(url, files=files)
            response.raise_for_status()
            
            result = response.json()
            print("\n✅ Upload successful!")
            print(f"   Upload ID: {result['upload_id']}")
            print(f"   Total rows: {result['total_rows']}")
            print(f"   Success: {result['success_count']}")
            print(f"   Errors: {result['error_count']}")
            
            if result.get('errors'):
                print("\n⚠️  Errors encountered:")
                for error in result['errors'][:5]:  # Show first 5 errors
                    print(f"   Row {error.get('row')}: {error.get('error')}")
            
            return result
            
        except requests.exceptions.RequestException as e:
            print(f"\n❌ Upload failed: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"   Response: {e.response.text}")
            return None


def get_incident_stats(upload_id: str = None):
    """Get incident statistics."""
    url = f"{API_BASE_URL}/incidents/stats/summary"
    
    params = {}
    if upload_id:
        params['upload_id'] = upload_id
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        stats = response.json()
        print("\n📊 Incident Statistics:")
        print(f"   Total incidents: {stats['total']}")
        
        if stats.get('by_status'):
            print("\n   By Status:")
            for status, count in stats['by_status'].items():
                print(f"      {status}: {count}")
        
        if stats.get('top_issue_types'):
            print("\n   Top Issue Types:")
            for issue_type, count in list(stats['top_issue_types'].items())[:5]:
                print(f"      {issue_type}: {count}")
        
        return stats
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Failed to get stats: {e}")
        return None


def list_incidents(page: int = 1, page_size: int = 10, upload_id: str = None):
    """List incidents with pagination."""
    url = f"{API_BASE_URL}/incidents/"
    
    params = {
        "page": page,
        "page_size": page_size,
    }
    if upload_id:
        params['upload_id'] = upload_id
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        result = response.json()
        print(f"\n📋 Incidents (Page {result['page']}, Total: {result['total']}):")
        
        for incident in result['incidents']:
            print(f"\n   ID: {incident['id']}")
            print(f"   Incident #: {incident['incident_number']}")
            print(f"   Customer: {incident.get('customer_name', 'N/A')}")
            print(f"   Issue Type: {incident.get('issue_type', 'N/A')}")
            print(f"   Status: {incident.get('status', 'N/A')}")
        
        return result
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Failed to list incidents: {e}")
        return None


if __name__ == "__main__":
    print("🚀 Testing Incident Upload API\n")
    print("=" * 60)
    
    # Upload file
    result = upload_incident_file(EXCEL_FILE_PATH)
    
    if result:
        upload_id = result['upload_id']
        
        # Get stats for this upload
        print("\n" + "=" * 60)
        get_incident_stats(upload_id)
        
        # List incidents from this upload
        print("\n" + "=" * 60)
        list_incidents(page=1, page_size=5, upload_id=upload_id)
    
    print("\n" + "=" * 60)
    print("✨ Test complete!")
