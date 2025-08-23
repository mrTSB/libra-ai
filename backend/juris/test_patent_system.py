#!/usr/bin/env python3
"""
Test Script for Patent Document Processing System
Tests the patent embedding pipeline and search functionality.
"""

import os
import sys
import logging
from pathlib import Path
from typing import List, Dict, Any

# Add the parent directory to sys.path to import our modules
sys.path.append(str(Path(__file__).parent))
sys.path.append(str(Path(__file__).parent.parent))

from patent_doc_processor import PatentDocumentProcessor, PatentRAGRetriever

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_document_processing():
    """Test the patent document processing functionality."""
    print("🧪 Testing Patent Document Processing...")
    
    try:
        current_dir = Path(__file__).parent
        patent_data_dir = current_dir / "patent_data"
        
        if not patent_data_dir.exists():
            print("❌ Patent data directory not found")
            return False
        
        # Initialize processor
        processor = PatentDocumentProcessor()
        
        # Get first PDF file for testing
        pdf_files = list(patent_data_dir.glob("*.pdf"))
        if not pdf_files:
            print("❌ No PDF files found for testing")
            return False
        
        test_pdf = pdf_files[0]
        print(f"📄 Testing with: {test_pdf.name}")
        
        # Test single document processing
        result = processor.process_document(str(test_pdf))
        
        if result is None:
            print("❌ Document processing failed")
            return False
        
        print(f"✅ Successfully processed document:")
        print(f"  - Document: {result['document_name']}")
        print(f"  - Chunks created: {result['total_chunks']}")
        print(f"  - Original text length: {result['metadata']['original_text_length']}")
        print(f"  - Clean text length: {result['metadata']['clean_text_length']}")
        
        # Test chunk content
        if result['chunks']:
            sample_chunk = result['chunks'][0]
            print(f"  - Sample chunk length: {len(sample_chunk['text'])}")
            print(f"  - Sample chunk preview: {sample_chunk['text'][:100]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Error in document processing test: {e}")
        return False

def test_full_pipeline():
    """Test the full patent processing pipeline."""
    print("\n🔄 Testing Full Patent Pipeline...")
    
    try:
        current_dir = Path(__file__).parent
        patent_data_dir = current_dir / "patent_data"
        test_pickle = current_dir / "test_patent_knowledge_base.pkl"
        
        # Clean up any existing test file
        if test_pickle.exists():
            test_pickle.unlink()
        
        # Initialize processor
        processor = PatentDocumentProcessor()
        
        # Process all documents
        knowledge_base = processor.process_patent_documents(str(patent_data_dir))
        
        # Save to test pickle
        processor.save_to_pickle(knowledge_base, str(test_pickle))
        
        print(f"✅ Full pipeline test successful:")
        print(f"  - Documents processed: {knowledge_base['metadata']['total_documents']}")
        print(f"  - Total chunks: {knowledge_base['metadata']['total_chunks']}")
        print(f"  - Test pickle created: {test_pickle.name}")
        
        # Clean up test file
        test_pickle.unlink()
        
        return True
        
    except Exception as e:
        print(f"❌ Error in full pipeline test: {e}")
        return False

def test_search_functionality():
    """Test the patent search functionality."""
    print("\n🔍 Testing Patent Search Functionality...")
    
    try:
        current_dir = Path(__file__).parent
        pickle_file = current_dir / "patent_knowledge_base.pkl"
        
        if not pickle_file.exists():
            print("⚠️  Patent knowledge base not found. Run setup_patent_system.py first.")
            return False
        
        # Initialize retriever
        retriever = PatentRAGRetriever(str(pickle_file))
        
        # Test queries
        test_queries = [
            "patent law principles",
            "intellectual property rights",
            "patent application process",
            "patent claims and specifications",
            "prior art search"
        ]
        
        print(f"📋 Testing with {len(test_queries)} sample queries...")
        
        for i, query in enumerate(test_queries, 1):
            print(f"\n  Query {i}: '{query}'")
            
            try:
                results = retriever.search_similar_chunks(query, top_k=3)
                
                if results:
                    print(f"    ✅ Found {len(results)} relevant chunks")
                    for j, result in enumerate(results, 1):
                        print(f"      {j}. Similarity: {result['similarity']:.3f}")
                        print(f"         Document: {result['document_name']}")
                        print(f"         Preview: {result['text'][:80]}...")
                else:
                    print(f"    ⚠️  No results found")
                    
            except Exception as e:
                print(f"    ❌ Query failed: {e}")
                return False
        
        print("\n✅ Search functionality test successful!")
        return True
        
    except Exception as e:
        print(f"❌ Error in search functionality test: {e}")
        return False

def test_interactive_search():
    """Interactive search mode for manual testing."""
    print("\n🎮 Interactive Patent Search Mode")
    print("Type your patent-related questions (or 'quit' to exit)")
    print("=" * 50)
    
    try:
        current_dir = Path(__file__).parent
        pickle_file = current_dir / "patent_knowledge_base.pkl"
        
        if not pickle_file.exists():
            print("⚠️  Patent knowledge base not found. Run setup_patent_system.py first.")
            return False
        
        retriever = PatentRAGRetriever(str(pickle_file))
        
        while True:
            query = input("\n🔍 Your question: ").strip()
            
            if query.lower() in ['quit', 'exit', 'q']:
                print("👋 Goodbye!")
                break
            
            if not query:
                continue
            
            try:
                print("🔄 Searching...")
                results = retriever.search_similar_chunks(query, top_k=3)
                
                if results:
                    print(f"\n📋 Found {len(results)} relevant sections:")
                    print("-" * 50)
                    
                    for i, result in enumerate(results, 1):
                        print(f"\n{i}. Document: {result['document_name']}")
                        print(f"   Similarity: {result['similarity']:.3f}")
                        print(f"   Content: {result['text'][:200]}...")
                        if len(result['text']) > 200:
                            print("   [content truncated]")
                else:
                    print("❌ No relevant sections found for your query.")
                    
            except Exception as e:
                print(f"❌ Search error: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error in interactive search: {e}")
        return False

def show_system_info():
    """Display information about the patent system."""
    print("📊 Patent Processing System Information")
    print("=" * 50)
    
    current_dir = Path(__file__).parent
    
    # Check data directory
    patent_data_dir = current_dir / "patent_data"
    if patent_data_dir.exists():
        pdf_files = list(patent_data_dir.glob("*.pdf"))
        print(f"📁 Patent Data Directory: {patent_data_dir}")
        print(f"   PDF files: {len(pdf_files)}")
        for pdf in pdf_files:
            print(f"   - {pdf.name}")
    else:
        print("❌ Patent data directory not found")
    
    # Check knowledge base
    pickle_file = current_dir / "patent_knowledge_base.pkl"
    if pickle_file.exists():
        print(f"\n💾 Knowledge Base: {pickle_file}")
        try:
            import pickle
            with open(pickle_file, 'rb') as f:
                kb = pickle.load(f)
            
            metadata = kb['metadata']
            print(f"   Documents: {metadata['total_documents']}")
            print(f"   Chunks: {metadata['total_chunks']}")
            print(f"   Model: {metadata['embedding_model']}")
            print(f"   Processed: {metadata['processed_at']}")
            
        except Exception as e:
            print(f"   ❌ Error reading knowledge base: {e}")
    else:
        print("\n❌ Knowledge base not found")
    
    # Check environment
    print(f"\n🔑 Environment:")
    print(f"   OPENAI_API_KEY: {'✅ Set' if os.getenv('OPENAI_API_KEY') else '❌ Missing'}")

def main():
    """Main test function."""
    print("🧪 Patent Document Processing System Tests")
    print("=" * 60)
    
    # Parse command line arguments
    if len(sys.argv) > 1 and sys.argv[1] == 'interactive':
        test_interactive_search()
        return
    
    if len(sys.argv) > 1 and sys.argv[1] == 'info':
        show_system_info()
        return
    
    # Run all tests
    test_results = []
    
    # Show system info first
    show_system_info()
    print()
    
    # Test 1: Document processing
    test_results.append(test_document_processing())
    
    # Test 2: Full pipeline
    test_results.append(test_full_pipeline())
    
    # Test 3: Search functionality
    test_results.append(test_search_functionality())
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Results Summary")
    print("=" * 60)
    
    passed = sum(test_results)
    total = len(test_results)
    
    test_names = [
        "Document Processing",
        "Full Pipeline",
        "Search Functionality"
    ]
    
    for i, (name, result) in enumerate(zip(test_names, test_results)):
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{i+1}. {name}: {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Your patent processing system is working correctly.")
        print("\n🚀 Usage examples:")
        print("  python test_patent_system.py info       # Show system information")
        print("  python test_patent_system.py interactive # Interactive search mode")
    else:
        print("\n⚠️  Some tests failed. Please check the error messages above.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
