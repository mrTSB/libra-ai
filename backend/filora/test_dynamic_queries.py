#!/usr/bin/env python3
"""
Test script for Filora Agent dynamic query functionality.
"""

import json
import requests
import time
from typing import Dict, Any

class FiloraDynamicTestClient:
    """Test client for Filora Agent dynamic query API."""
    
    def __init__(self, base_url: str = "http://localhost:8003"):
        self.base_url = base_url
    
    def test_health(self) -> bool:
        """Test if the API is healthy."""
        try:
            response = requests.get(f"{self.base_url}/health")
            return response.status_code == 200
        except Exception as e:
            print(f"❌ Health check failed: {e}")
            return False
    
    def test_natural_language_query(self, query: str, url: str = None, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Test natural language query execution."""
        test_data = {
            "query": query,
            "timeout": 30
        }
        
        if url:
            test_data["url"] = url
            
        if context:
            test_data["context"] = context
        
        print(f"🤖 Testing query: '{query}'")
        if url:
            print(f"   URL: {url}")
        if context:
            print(f"   Context: {context}")
        
        response = requests.post(f"{self.base_url}/query", json=test_data)
        result = response.json()
        
        if response.status_code == 200:
            print(f"✅ Query executed successfully")
            print(f"   Task ID: {result.get('task_id', 'N/A')}")
            print(f"   Screenshots: {len(result.get('screenshots', []))}")
            print(f"   Execution time: {result.get('execution_time', 0):.2f}s")
            print(f"   Result: {result.get('result', {}).get('message', 'No message')}")
        else:
            print(f"❌ Query failed: {result}")
        
        return result
    
    def run_comprehensive_tests(self):
        """Run a comprehensive set of dynamic query tests."""
        print("🧪 Testing Filora Agent Dynamic Query System...\n")
        
        # Test 1: Health check
        print("1️⃣ Testing health endpoint...")
        if not self.test_health():
            print("❌ API is not healthy, stopping tests")
            return
        print("✅ Health check passed\n")
        
        # Test 2: Simple navigation query
        print("2️⃣ Testing simple navigation query...")
        self.test_natural_language_query(
            query="Go to https://httpbin.org and take a screenshot",
            context={"test_type": "navigation"}
        )
        print()
        
        # Test 3: Form filling query
        print("3️⃣ Testing form filling query...")
        self.test_natural_language_query(
            query="Fill out the contact form with name 'John Doe' and email 'john@example.com'",
            url="https://httpbin.org/forms/post",
            context={
                "form_data": {
                    "name": "John Doe",
                    "email": "john@example.com"
                }
            }
        )
        print()
        
        # Test 4: Data extraction query
        print("4️⃣ Testing data extraction query...")
        self.test_natural_language_query(
            query="Extract the page title and description from the website",
            url="https://httpbin.org"
        )
        print()
        
        # Test 5: Clicking query
        print("5️⃣ Testing clicking query...")
        self.test_natural_language_query(
            query="Find and click on the 'HTTP Methods' link",
            url="https://httpbin.org"
        )
        print()
        
        # Test 6: Search query
        print("6️⃣ Testing search query...")
        self.test_natural_language_query(
            query="Go to google.com and search for 'browser automation'",
            context={"search_term": "browser automation"}
        )
        print()
        
        # Test 7: Complex multi-step query
        print("7️⃣ Testing complex multi-step query...")
        self.test_natural_language_query(
            query="Navigate to the GitHub homepage, find the search box, search for 'python web scraping', and click on the first result",
            url="https://github.com"
        )
        print()
        
        # Test 8: URL extraction from query
        print("8️⃣ Testing URL extraction from query...")
        self.test_natural_language_query(
            query="Visit stackoverflow.com and look for questions about Python automation"
        )
        print()
        
        print("🎉 Dynamic query testing completed!")


def main():
    """Run the dynamic query tests."""
    client = FiloraDynamicTestClient()
    client.run_comprehensive_tests()


if __name__ == "__main__":
    main()
