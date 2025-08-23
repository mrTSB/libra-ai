#!/usr/bin/env python3
"""
Test script to check if the legal chat API can be imported and started.
"""

try:
    print("🔍 Testing API imports...")
    
    print("1. Testing legal_doc_processor import...")
    from legal_doc_processor import LegalRAGRetriever
    print("✅ legal_doc_processor imported successfully")
    
    print("2. Testing legal_chat_api import...")
    from legal_chat_api import app
    print("✅ legal_chat_api imported successfully")
    
    print("3. Testing knowledge base loading...")
    retriever = LegalRAGRetriever("legal_knowledge_base.pkl")
    print(f"✅ Knowledge base loaded with {len(retriever.chunks)} chunks")
    
    print("4. Testing FastAPI app creation...")
    print(f"✅ FastAPI app created: {type(app)}")
    
    print("\n🎉 All imports successful! API should be able to start.")
    print("Try starting manually with: uvicorn legal_chat_api:app --host 0.0.0.0 --port 8000")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
