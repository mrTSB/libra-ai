#!/usr/bin/env python3
"""
Patent Search API Demonstration
Shows how to use the Patent Search API with real examples.
"""

import requests
import json
import time
from typing import Dict, Any

# Configuration
API_BASE_URL = "http://localhost:8001"

def demo_patent_search():
    """Demonstrate patent similarity search with realistic examples."""
    print("🎯 Patent Search API Demonstration")
    print("=" * 50)
    
    # Check if API is running
    try:
        response = requests.get(f"{API_BASE_URL}/")
        if response.status_code != 200:
            print("❌ API is not responding. Please start the server first:")
            print("   python start_patent_api.py")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API. Please start the server first:")
        print("   python start_patent_api.py")
        return False
    
    # Demo cases with realistic patent descriptions
    demo_cases = [
        {
            "title": "AI-Powered Image Recognition",
            "description": """
            A computer-implemented method for automatically identifying and classifying objects 
            in digital images using deep neural networks. The system processes input images 
            through convolutional layers to extract features, applies classification algorithms 
            to identify objects, and outputs confidence scores for each detected object class.
            """.strip(),
            "use_web_search": True,
            "use_local_corpus": True,
            "max_local_results": 3,
            "max_web_results": 4
        },
        {
            "title": "Patent Filing Management System",
            "description": """
            A digital platform for managing intellectual property applications, including 
            patent filings, trademark registrations, and copyright submissions. The system 
            tracks application status, manages deadlines, and provides automated notifications 
            for required actions and renewals.
            """.strip(),
            "use_web_search": False,  # Test local corpus only
            "use_local_corpus": True,
            "max_local_results": 5,
            "max_web_results": 0
        },
        {
            "title": "Blockchain-Based Authentication",
            "description": """
            A security system that uses blockchain technology to authenticate users and 
            secure digital transactions. The method involves creating immutable identity 
            records on a distributed ledger, implementing smart contracts for access control, 
            and providing cryptographic verification of user credentials.
            """.strip(),
            "use_web_search": True,
            "use_local_corpus": True,
            "max_local_results": 2,
            "max_web_results": 3
        }
    ]
    
    for i, case in enumerate(demo_cases, 1):
        print(f"\n🔍 Demo Case {i}: {case['title']}")
        print("-" * 40)
        print(f"Description: {case['description'][:100]}...")
        print(f"Search settings: Local={case['use_local_corpus']}, Web={case['use_web_search']}")
        
        try:
            # Make API request
            print("⏳ Searching for similar patents...")
            start_time = time.time()
            
            response = requests.post(
                f"{API_BASE_URL}/patent/search",
                json=case,
                headers={"Content-Type": "application/json"}
            )
            
            search_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                print(f"✅ Search completed in {search_time:.2f} seconds")
                print(f"📊 Results summary:")
                print(f"   - Local corpus: {data.get('local_results_count', 0)} matches")
                print(f"   - Web search: {data.get('web_results_count', 0)} matches")
                print(f"   - Total: {data.get('total_results', 0)} similar patents found")
                
                # Show top results
                similar_patents = data.get('similar_patents', [])
                if similar_patents:
                    print(f"\n📋 Top similar patents:")
                    
                    for j, patent in enumerate(similar_patents[:3], 1):
                        print(f"\n   {j}. {patent.get('title', 'Unknown Title')[:60]}...")
                        print(f"      Source: {patent.get('result_type', 'Unknown').replace('_', ' ').title()}")
                        
                        if patent.get('similarity_score'):
                            score = patent.get('similarity_score', 0)
                            print(f"      Similarity: {score:.3f} ({score*100:.1f}%)")
                        
                        if patent.get('patent_number'):
                            print(f"      Patent Number: {patent.get('patent_number')}")
                        
                        # Show description preview
                        desc = patent.get('description', '')
                        if desc:
                            preview = desc[:120] + "..." if len(desc) > 120 else desc
                            print(f"      Preview: {preview}")
                        
                        # Source info
                        source = patent.get('source', '')
                        if source and not source.startswith('Local'):
                            print(f"      URL: {source[:50]}...")
                
                print(f"\n💬 {data.get('search_summary', '')}")
                
            else:
                print(f"❌ Search failed: {response.status_code}")
                print(f"Error: {response.text}")
                
        except Exception as e:
            print(f"❌ Error in demo case {i}: {e}")
        
        # Add spacing between cases
        if i < len(demo_cases):
            print("\n" + "="*20 + " Next Case " + "="*20)
    
    return True

def demo_api_features():
    """Demonstrate various API features."""
    print("\n🛠️  Additional API Features Demo")
    print("=" * 40)
    
    # 1. Status check
    print("\n1. 📊 System Status Check")
    try:
        response = requests.get(f"{API_BASE_URL}/patent/status")
        if response.status_code == 200:
            data = response.json()
            print("✅ Status retrieved:")
            print(f"   - Patent corpus loaded: {data.get('patent_corpus_loaded', False)}")
            print(f"   - Corpus chunks: {data.get('corpus_chunks', 0)}")
            print(f"   - Web search available: {data.get('web_search_available', False)}")
            
            api_keys = data.get('api_keys_configured', {})
            print(f"   - API Keys: OpenAI={api_keys.get('openai', False)}, Exa={api_keys.get('exa', False)}")
    except Exception as e:
        print(f"❌ Status check failed: {e}")
    
    # 2. Local search only
    print("\n2. 🔍 Quick Local Search")
    try:
        params = {"query": "patent law principles", "max_results": 2}
        response = requests.get(f"{API_BASE_URL}/patent/search-local", params=params)
        
        if response.status_code == 200:
            data = response.json()
            results = data.get('results', [])
            print(f"✅ Found {len(results)} local results:")
            
            for i, result in enumerate(results, 1):
                print(f"   {i}. {result.get('document_name', 'Unknown')}")
                print(f"      Similarity: {result.get('similarity', 0):.3f}")
        else:
            print(f"❌ Local search failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Local search error: {e}")
    
    # 3. Show API endpoints
    print("\n3. 📚 Available API Endpoints")
    endpoints = [
        ("GET", "/", "Health check and system info"),
        ("GET", "/patent/status", "System status and configuration"),
        ("POST", "/patent/search", "Main patent similarity search"),
        ("GET", "/patent/search-local", "Local corpus search only"),
        ("POST", "/patent/reload", "Reload knowledge base"),
        ("GET", "/docs", "Interactive API documentation")
    ]
    
    for method, endpoint, description in endpoints:
        print(f"   {method:4} {endpoint:20} - {description}")
    
    print(f"\n🌐 Full API documentation: {API_BASE_URL}/docs")

def show_usage_tips():
    """Show tips for using the Patent Search API effectively."""
    print("\n💡 Usage Tips for Patent Search API")
    print("=" * 40)
    
    tips = [
        "📝 Write detailed descriptions: More context leads to better matches",
        "🔄 Use both local and web search: Combines corpus knowledge with current data",
        "⚖️  Adjust result limits: Higher limits for comprehensive search, lower for quick checks",
        "🎯 Include technical terms: Patent-specific language improves search accuracy",
        "🔍 Try different phrasings: Rephrase your query if results aren't relevant",
        "📊 Check similarity scores: Higher scores (>0.7) indicate strong relevance",
        "🌐 Review source types: Local corpus for legal principles, web for recent patents",
        "⏱️  Be patient: Web searches may take longer but provide broader coverage"
    ]
    
    for tip in tips:
        print(f"   {tip}")
    
    print(f"\n🚀 Quick Start Commands:")
    print(f"   # Start API server")
    print(f"   python start_patent_api.py")
    print(f"   ")
    print(f"   # Test API")
    print(f"   python test_patent_api.py quick")
    print(f"   ")
    print(f"   # Interactive search")
    print(f"   python test_patent_api.py interactive")

def main():
    """Main demonstration function."""
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == 'tips':
        show_usage_tips()
        return
    
    if len(sys.argv) > 1 and sys.argv[1] == 'features':
        demo_api_features()
        return
    
    # Run full demo
    print("🎭 Patent Search API Complete Demonstration")
    print("This demo shows the Patent Search API in action with realistic examples")
    print("Make sure the API server is running: python start_patent_api.py")
    print()
    
    input("Press Enter to start the demonstration...")
    
    # Main demo
    success = demo_patent_search()
    
    if success:
        # Additional features
        demo_api_features()
        show_usage_tips()
        
        print("\n" + "=" * 60)
        print("🎉 Demonstration completed successfully!")
        print("\n🔥 Ready to integrate patent search into your application!")
        print("📚 Check out the API docs for more details:")
        print(f"   {API_BASE_URL}/docs")
    else:
        print("\n❌ Demonstration failed. Please check the API server.")

if __name__ == "__main__":
    main()
