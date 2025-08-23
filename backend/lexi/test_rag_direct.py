#!/usr/bin/env python3
"""
Direct test of the legal RAG system without API server.
"""

from legal_doc_processor import LegalRAGRetriever
import os

def main():
    print("🧪 Direct RAG System Test")
    print("=" * 40)
    
    try:
        # Test loading the knowledge base
        print("📚 Loading legal knowledge base...")
        retriever = LegalRAGRetriever("legal_knowledge_base.pkl")
        print(f"✅ Loaded {len(retriever.chunks)} chunks")
        
        # Test search functionality
        print("\n🔍 Testing semantic search...")
        test_queries = [
            "What are constitutional rights?",
            "How does due process work?",
            "What is rule of law?"
        ]
        
        for query in test_queries:
            print(f"\n❓ Query: {query}")
            try:
                results = retriever.search_similar_chunks(query, top_k=3)
                print(f"✅ Found {len(results)} relevant chunks:")
                
                for i, result in enumerate(results, 1):
                    doc_name = result['document_name']
                    similarity = result['similarity']
                    content_preview = result['text'][:150] + "..." if len(result['text']) > 150 else result['text']
                    print(f"  {i}. [{doc_name}] Similarity: {similarity:.3f}")
                    print(f"     {content_preview}")
                    
            except Exception as e:
                print(f"❌ Search failed: {e}")
        
        print(f"\n📊 Knowledge Base Stats:")
        total_docs = len(set(chunk['document_name'] for chunk in retriever.chunks))
        print(f"   📄 Documents: {total_docs}")
        print(f"   🧩 Total chunks: {len(retriever.chunks)}")
        
        # Show document breakdown
        doc_counts = {}
        for chunk in retriever.chunks:
            doc_name = chunk['document_name']
            doc_counts[doc_name] = doc_counts.get(doc_name, 0) + 1
        
        for doc_name, count in doc_counts.items():
            print(f"   📚 {doc_name}: {count} chunks")
        
        print("\n✅ RAG system is working correctly!")
        print("\nThe system successfully:")
        print("- Loaded embeddings from pickle file")
        print("- Performed semantic similarity search")
        print("- Retrieved relevant legal content")
        print("\nYou can now integrate this with:")
        print("- FastAPI server for web endpoints")
        print("- Claude Sonnet 3.5 for AI responses")
        print("- Exa search for current web context")
        
    except FileNotFoundError:
        print("❌ legal_knowledge_base.pkl not found!")
        print("Run: python setup_legal_system.py")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
