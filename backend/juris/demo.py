#!/usr/bin/env python3
"""
Patent Document Processing Pipeline Demo
Demonstrates the complete workflow from PDF processing to semantic search.
"""

import sys
from pathlib import Path

# Add the current directory to sys.path to import our modules
sys.path.append(str(Path(__file__).parent))

def demo_pipeline():
    """Demonstrate the complete patent processing pipeline."""
    print("🏗️  Patent Document Processing Pipeline Demo")
    print("=" * 55)
    
    # Check if system is ready
    current_dir = Path(__file__).parent
    pickle_file = current_dir / "patent_knowledge_base.pkl"
    
    if not pickle_file.exists():
        print("⚠️  Patent knowledge base not found!")
        print("📋 To get started:")
        print("   1. Set up your .env file with OPENAI_API_KEY")
        print("   2. Run: python setup_patent_system.py")
        print("   3. Then run this demo again")
        return False
    
    try:
        from patent_doc_processor import PatentRAGRetriever
        
        print("🔍 Loading patent knowledge base...")
        retriever = PatentRAGRetriever(str(pickle_file))
        
        print(f"✅ Loaded {len(retriever.chunks)} patent document chunks")
        
        # Demo queries
        demo_queries = [
            "What are the basic principles of patent law?",
            "How do you file a patent application?",
            "What constitutes prior art in patent law?",
            "What are patent claims and specifications?",
            "How does patent prosecution work?"
        ]
        
        print("\n🎯 Running demo queries...")
        print("=" * 55)
        
        for i, query in enumerate(demo_queries, 1):
            print(f"\n📋 Query {i}: {query}")
            print("-" * 40)
            
            results = retriever.search_similar_chunks(query, top_k=2)
            
            if results:
                for j, result in enumerate(results, 1):
                    print(f"\n  Result {j} (similarity: {result['similarity']:.3f})")
                    print(f"  📄 Document: {result['document_name']}")
                    print(f"  📝 Content: {result['text'][:150]}...")
                    if len(result['text']) > 150:
                        print("      [content truncated]")
            else:
                print("  ❌ No relevant results found")
        
        print("\n" + "=" * 55)
        print("🎉 Demo completed successfully!")
        print("\n🚀 Try interactive mode: python test_patent_system.py interactive")
        
        return True
        
    except Exception as e:
        print(f"❌ Demo failed: {e}")
        return False

if __name__ == "__main__":
    demo_pipeline()
