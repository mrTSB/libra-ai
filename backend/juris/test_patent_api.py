#!/usr/bin/env python3
"""
Test Script for Patent Search API
Tests the patent API endpoints and search functionality.
"""

import asyncio
import json
import requests
from typing import Dict, Any, Optional
from pathlib import Path

# Configuration
API_BASE_URL = "http://localhost:8001"

def test_api_health():
    """Test the API health check endpoint."""
    print("🔍 Testing API Health Check...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ API is running")
            print(f"  - Patent corpus loaded: {data.get('patent_corpus_loaded', False)}")
            print(f"  - Web search available: {data.get('web_search_available', False)}")
            return True
        else:
            print(f"❌ API health check failed: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API. Make sure the server is running on port 8001")
        return False
    except Exception as e:
        print(f"❌ Error testing API health: {e}")
        return False

def test_patent_status():
    """Test the patent status endpoint."""
    print("\n📊 Testing Patent Status...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/patent/status")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Patent status retrieved")
            print(f"  - Corpus loaded: {data.get('patent_corpus_loaded', False)}")
            print(f"  - Corpus chunks: {data.get('corpus_chunks', 0)}")
            print(f"  - Web search available: {data.get('web_search_available', False)}")
            print(f"  - API keys configured: {data.get('api_keys_configured', {})}")
            return True
        else:
            print(f"❌ Patent status failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing patent status: {e}")
        return False

def test_local_search():
    """Test the local patent search endpoint."""
    print("\n🔍 Testing Local Patent Search...")
    
    try:
        params = {
            "query": "patent application process",
            "max_results": 3
        }
        
        response = requests.get(f"{API_BASE_URL}/patent/search-local", params=params)
        
        if response.status_code == 200:
            data = response.json()
            results = data.get('results', [])
            print(f"✅ Local search successful - found {len(results)} results")
            
            for i, result in enumerate(results[:2], 1):  # Show first 2 results
                print(f"  {i}. Document: {result.get('document_name', 'Unknown')}")
                print(f"     Similarity: {result.get('similarity', 0):.3f}")
                print(f"     Preview: {result.get('text', '')[:80]}...")
            
            return True
        else:
            print(f"❌ Local search failed: {response.status_code}")
            if response.status_code == 503:
                print("   Reason: Patent knowledge base not loaded")
            return False
            
    except Exception as e:
        print(f"❌ Error testing local search: {e}")
        return False

def test_patent_similarity_search():
    """Test the main patent similarity search endpoint."""
    print("\n🎯 Testing Patent Similarity Search...")
    
    test_cases = [
        {
            "description": "A method for processing digital images using machine learning algorithms to detect objects and classify them into categories",
            "title": "Machine Learning Image Classification System",
            "use_web_search": True,
            "use_local_corpus": True,
            "max_local_results": 3,
            "max_web_results": 3
        },
        {
            "description": "System for managing intellectual property rights and patent applications in a digital database",
            "use_web_search": False,  # Test local only
            "use_local_corpus": True,
            "max_local_results": 5,
            "max_web_results": 0
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n  Test Case {i}: {test_case['description'][:60]}...")
        
        try:
            response = requests.post(
                f"{API_BASE_URL}/patent/search",
                json=test_case,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"  ✅ Search successful")
                print(f"    - Local results: {data.get('local_results_count', 0)}")
                print(f"    - Web results: {data.get('web_results_count', 0)}")
                print(f"    - Total results: {data.get('total_results', 0)}")
                print(f"    - Summary: {data.get('search_summary', '')}")
                
                # Show top result
                similar_patents = data.get('similar_patents', [])
                if similar_patents:
                    top_result = similar_patents[0]
                    print(f"    - Top result: {top_result.get('title', 'Unknown')[:50]}...")
                    print(f"    - Source type: {top_result.get('result_type', 'Unknown')}")
                    if top_result.get('similarity_score'):
                        print(f"    - Similarity: {top_result.get('similarity_score', 0):.3f}")
                
            else:
                print(f"  ❌ Search failed: {response.status_code}")
                print(f"    Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"  ❌ Error in test case {i}: {e}")
            return False
    
    return True

def test_api_documentation():
    """Test if API documentation is accessible."""
    print("\n📚 Testing API Documentation...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/docs")
        
        if response.status_code == 200:
            print("✅ API documentation is accessible at /docs")
            return True
        else:
            print(f"⚠️  API documentation not accessible: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error accessing API docs: {e}")
        return False

def interactive_patent_search():
    """Interactive mode for testing patent searches."""
    print("\n🎮 Interactive Patent Search Mode")
    print("Enter patent descriptions to search for similar patents")
    print("Type 'quit' to exit")
    print("=" * 60)
    
    while True:
        description = input("\n📝 Patent description: ").strip()
        
        if description.lower() in ['quit', 'exit', 'q']:
            print("👋 Goodbye!")
            break
        
        if not description:
            continue
        
        # Optional title
        title = input("📋 Patent title (optional): ").strip()
        title = title if title else None
        
        try:
            search_request = {
                "description": description,
                "title": title,
                "use_web_search": True,
                "use_local_corpus": True,
                "max_local_results": 3,
                "max_web_results": 3
            }
            
            print("🔄 Searching for similar patents...")
            
            response = requests.post(
                f"{API_BASE_URL}/patent/search",
                json=search_request,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"\n📋 Found similar patents:")
                print(f"Local corpus: {data.get('local_results_count', 0)} results")
                print(f"Web search: {data.get('web_results_count', 0)} results")
                print("-" * 60)
                
                for i, patent in enumerate(data.get('similar_patents', [])[:5], 1):
                    print(f"\n{i}. {patent.get('title', 'Unknown Title')}")
                    print(f"   Type: {patent.get('result_type', 'Unknown')}")
                    if patent.get('similarity_score'):
                        print(f"   Similarity: {patent.get('similarity_score', 0):.3f}")
                    if patent.get('patent_number'):
                        print(f"   Patent #: {patent.get('patent_number')}")
                    print(f"   Description: {patent.get('description', '')[:150]}...")
                    print(f"   Source: {patent.get('source', 'Unknown')[:50]}...")
                
            else:
                print(f"❌ Search failed: {response.status_code}")
                print(f"Error: {response.text}")
                
        except Exception as e:
            print(f"❌ Search error: {e}")

def show_usage_examples():
    """Show API usage examples."""
    print("🚀 Patent Search API Usage Examples")
    print("=" * 50)
    
    examples = [
        {
            "title": "Basic Patent Search",
            "endpoint": "POST /patent/search",
            "payload": {
                "description": "A smartphone with improved battery life using AI optimization",
                "use_web_search": True,
                "use_local_corpus": True,
                "max_local_results": 5,
                "max_web_results": 5
            }
        },
        {
            "title": "Local Corpus Only",
            "endpoint": "POST /patent/search", 
            "payload": {
                "description": "Method for patent application filing",
                "use_web_search": False,
                "use_local_corpus": True,
                "max_local_results": 10
            }
        },
        {
            "title": "Quick Local Search",
            "endpoint": "GET /patent/search-local?query=patent%20law&max_results=3",
            "payload": None
        }
    ]
    
    for example in examples:
        print(f"\n📋 {example['title']}")
        print(f"   Endpoint: {example['endpoint']}")
        if example['payload']:
            print(f"   Payload: {json.dumps(example['payload'], indent=2)}")
        print()

def main():
    """Main test function."""
    print("🧪 Patent Search API Test Suite")
    print("=" * 50)
    
    # Parse command line arguments
    import sys
    if len(sys.argv) > 1:
        if sys.argv[1] == 'interactive':
            interactive_patent_search()
            return
        elif sys.argv[1] == 'examples':
            show_usage_examples()
            return
        elif sys.argv[1] == 'quick':
            # Quick test - just health check and status
            success = test_api_health() and test_patent_status()
            print(f"\n🎯 Quick test: {'✅ PASSED' if success else '❌ FAILED'}")
            return
    
    # Run full test suite
    test_results = []
    
    print("🏁 Starting test suite...")
    print()
    
    # Test 1: API Health
    test_results.append(test_api_health())
    
    # Test 2: Patent Status
    test_results.append(test_patent_status())
    
    # Test 3: Local Search
    test_results.append(test_local_search())
    
    # Test 4: Patent Similarity Search
    test_results.append(test_patent_similarity_search())
    
    # Test 5: API Documentation
    test_results.append(test_api_documentation())
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary")
    print("=" * 50)
    
    passed = sum(test_results)
    total = len(test_results)
    
    test_names = [
        "API Health Check",
        "Patent Status",
        "Local Search",
        "Patent Similarity Search",
        "API Documentation"
    ]
    
    for i, (name, result) in enumerate(zip(test_names, test_results)):
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{i+1}. {name}: {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Your patent search API is working correctly.")
        print("\n🚀 Usage modes:")
        print("  python test_patent_api.py quick       # Quick health check")
        print("  python test_patent_api.py interactive # Interactive search")
        print("  python test_patent_api.py examples    # Show usage examples")
        print("\n📚 API Documentation: http://localhost:8001/docs")
    else:
        print("\n⚠️  Some tests failed. Check that:")
        print("  1. The API server is running: python patent_api.py")
        print("  2. Patent knowledge base is loaded")
        print("  3. Required API keys are configured")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
