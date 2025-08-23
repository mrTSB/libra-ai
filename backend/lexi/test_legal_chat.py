#!/usr/bin/env python3
"""
Test script for the legal chat API.
"""

import requests
import json
import sys
from typing import Dict, Any

API_BASE_URL = "http://localhost:8000"

def test_api_health():
    """Test if the API is running."""
    try:
        response = requests.get(f"{API_BASE_URL}/")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ API health check failed: {e}")
        return None

def test_legal_status():
    """Test the legal system status."""
    try:
        response = requests.get(f"{API_BASE_URL}/legal/status")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ Legal status check failed: {e}")
        return None

def ask_legal_question(question: str, use_web_search: bool = True, use_local_docs: bool = True):
    """Ask a legal question."""
    try:
        payload = {
            "question": question,
            "use_web_search": use_web_search,
            "use_local_docs": use_local_docs,
            "max_local_results": 5,
            "max_web_results": 3
        }
        
        response = requests.post(
            f"{API_BASE_URL}/legal/chat",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ Legal chat request failed: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response: {e.response.text}")
        return None

def search_local_docs(query: str, max_results: int = 5):
    """Search local legal documents."""
    try:
        response = requests.get(
            f"{API_BASE_URL}/legal/search",
            params={"query": query, "max_results": max_results}
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ Local search failed: {e}")
        return None

def print_legal_response(response: Dict[str, Any]):
    """Pretty print a legal response."""
    print("\n" + "="*80)
    print("🏛️  LEGAL ASSISTANT RESPONSE")
    print("="*80)
    
    print(f"\n📝 ANSWER:")
    print(response['answer'])
    
    if response.get('local_context_used'):
        print(f"\n📚 LOCAL SOURCES USED ({len(response['local_context_used'])}):")
        for i, ctx in enumerate(response['local_context_used'], 1):
            print(f"  {i}. {ctx['title']} (Relevance: {ctx['relevance_score']:.3f})")
    
    if response.get('web_context_used'):
        print(f"\n🌐 WEB SOURCES USED ({len(response['web_context_used'])}):")
        for i, ctx in enumerate(response['web_context_used'], 1):
            print(f"  {i}. {ctx['title']}")
            print(f"     URL: {ctx['source']}")
    
    print("\n" + "="*80)

def main():
    """Main test function."""
    print("🧪 Testing Legal Chat API")
    print("=" * 50)
    
    # Test API health
    print("\n1. Testing API health...")
    health = test_api_health()
    if not health:
        print("❌ API is not running. Please start with: python legal_chat_api.py")
        return False
    
    print(f"✅ API Status: {health['status']}")
    print(f"✅ Legal KB Loaded: {health['legal_kb_loaded']}")
    
    # Test legal system status
    print("\n2. Testing legal system status...")
    status = test_legal_status()
    if not status:
        return False
    
    print(f"✅ Legal Retriever: {status['legal_retriever_loaded']}")
    print(f"✅ Total Chunks: {status['total_chunks']}")
    print(f"✅ Documents: {', '.join(status['documents']) if status['documents'] else 'None'}")
    print(f"✅ Anthropic API: {status['anthropic_configured']}")
    print(f"✅ Exa API: {status['exa_configured']}")
    
    if not status['legal_retriever_loaded']:
        print("❌ Legal knowledge base not loaded. Run setup_legal_system.py first.")
        return False
    
    # Test local document search
    print("\n3. Testing local document search...")
    search_query = "constitutional rights"
    search_results = search_local_docs(search_query)
    if search_results:
        print(f"✅ Found {len(search_results['results'])} results for '{search_query}'")
        for i, result in enumerate(search_results['results'][:3], 1):
            print(f"  {i}. {result['document_name']} (Score: {result['similarity']:.3f})")
    
    # Test legal questions
    print("\n4. Testing legal chat questions...")
    
    test_questions = [
        "What are the basic constitutional rights of citizens?",
        "How does the rule of law apply in democratic societies?",
        "What are the fundamental principles of due process?"
    ]
    
    for i, question in enumerate(test_questions, 1):
        print(f"\n--- Question {i} ---")
        print(f"Q: {question}")
        
        response = ask_legal_question(question)
        if response:
            print_legal_response(response)
        else:
            print("❌ Failed to get response")
        
        if i < len(test_questions):
            input("\nPress Enter to continue to next question...")
    
    print("\n🎉 Testing completed!")
    print("\nYou can now use the API at http://localhost:8000")
    print("View interactive docs at http://localhost:8000/docs")
    
    return True

def interactive_mode():
    """Interactive mode for asking questions."""
    print("\n🤖 Interactive Legal Chat Mode")
    print("Type 'quit' to exit")
    print("-" * 40)
    
    while True:
        try:
            question = input("\n❓ Ask a legal question: ").strip()
            
            if question.lower() in ['quit', 'exit', 'q']:
                break
            
            if not question:
                continue
            
            print("🔍 Processing your question...")
            response = ask_legal_question(question)
            
            if response:
                print_legal_response(response)
            else:
                print("❌ Sorry, I couldn't process your question. Please try again.")
        
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print("\n👋 Goodbye!")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "interactive":
        interactive_mode()
    else:
        success = main()
        if success:
            print("\nWould you like to try interactive mode? (y/n)")
            if input().lower().startswith('y'):
                interactive_mode()
