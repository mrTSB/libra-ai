#!/usr/bin/env python3
"""
Test script for Filora Agent.
"""

import requests
import time
from typing import Dict, Any


class FiloraTestClient:
    """Test client for Filora Agent API."""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
    
    def test_health(self) -> bool:
        """Test health endpoint."""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def test_fill_form(self) -> Dict[str, Any]:
        """Test form filling functionality."""
        # Use a simple test form
        test_data = {
            "url": "https://httpbin.org/forms/post",
            "form_data": [
                {"name": "custname", "value": "John Doe"},
                {"name": "custtel", "value": "+1-555-0123"},
                {"name": "custemail", "value": "john@example.com"},
                {"name": "comments", "value": "This is a test comment from Filora agent."}
            ],
            "submit": False  # Don't submit for testing
        }
        
        response = requests.post(f"{self.base_url}/fill-form", json=test_data)
        return response.json()
    
    def test_click_element(self) -> Dict[str, Any]:
        """Test element clicking."""
        # Use a more reliable selector - httpbin.org has links to different endpoints
        test_data = {
            "url": "https://httpbin.org/",
            "selector": "a[href*='get']",  # Look for any link containing 'get' (like /get endpoint)
            "description": "GET endpoint link"
        }
        
        response = requests.post(f"{self.base_url}/click-element", json=test_data)
        return response.json()
    
    def test_extract_data(self) -> Dict[str, Any]:
        """Test data extraction."""
        test_data = {
            "url": "https://httpbin.org/",
            "selectors": {
                "title": "h1",
                "description": "p"
            }
        }
        
        response = requests.post(f"{self.base_url}/extract-data", json=test_data)
        return response.json()


def main():
    """Run Filora Agent tests."""
    print("🧪 Testing Filora Agent...")
    
    client = FiloraTestClient()
    
    # Test 1: Health check
    print("\n1️⃣ Testing health endpoint...")
    if client.test_health():
        print("✅ Health check passed")
    else:
        print("❌ Health check failed - is the server running?")
        print("   Start with: python filora/start_filora.py")
        return
    
    # Test 2: Form filling
    print("\n2️⃣ Testing form filling...")
    try:
        result = client.test_fill_form()
        if result.get('status') == 'completed':
            print("✅ Form filling test passed")
            filled_fields = result.get('result', {}).get('filled_fields', [])
            successful = len([f for f in filled_fields if f.get('status') == 'success'])
            print(f"   Successfully filled {successful}/{len(filled_fields)} fields")
        else:
            print(f"❌ Form filling test failed: {result.get('message', 'Unknown error')}")
    except Exception as e:
        print(f"❌ Form filling test error: {e}")
    
    # Test 3: Element clicking
    print("\n3️⃣ Testing element clicking...")
    try:
        result = client.test_click_element()
        if result.get('status') == 'completed':
            print("✅ Element clicking test passed")
        else:
            error_msg = result.get('message', 'Unknown error')
            error_detail = result.get('error', '')
            detail = result.get('detail', '')
            print(f"❌ Element clicking test failed: {error_msg}")
            if error_detail:
                print(f"   Error details: {error_detail}")
            if detail:
                print(f"   API detail: {detail}")
    except Exception as e:
        print(f"❌ Element clicking test error: {e}")
    
    # Test 4: Data extraction
    print("\n4️⃣ Testing data extraction...")
    try:
        result = client.test_extract_data()
        if result.get('status') == 'completed':
            print("✅ Data extraction test passed")
            extracted = result.get('result', {}).get('extracted_data', {})
            print(f"   Extracted data: {list(extracted.keys())}")
        else:
            print(f"❌ Data extraction test failed: {result.get('message', 'Unknown error')}")
    except Exception as e:
        print(f"❌ Data extraction test error: {e}")
    
    print("\n🎉 Testing completed!")
    print("\n📋 API Documentation: http://localhost:8000/docs")


if __name__ == "__main__":
    main()
