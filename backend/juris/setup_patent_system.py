#!/usr/bin/env python3
"""
Patent System Setup Script
Automated setup for the patent document processing and embedding system.
"""

import os
import sys
import subprocess
import logging
from pathlib import Path
from typing import Dict, Any
from dotenv import load_dotenv

# Add the parent directory to sys.path to import our modules
sys.path.append(str(Path(__file__).parent))
sys.path.append(str(Path(__file__).parent.parent))

from patent_doc_processor import PatentDocumentProcessor

load_dotenv()


# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def check_environment():
    """Check if required environment variables are set."""
    load_dotenv()
    
    required_vars = ['OPENAI_API_KEY']
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
        logger.error("Please create a .env file with the required API keys.")
        logger.error("You can copy from backend/lexi/env.example and fill in your keys.")
        return False
    
    logger.info("✅ Environment variables check passed")
    return True

def check_patent_data():
    """Check if patent data directory exists and contains PDF files."""
    current_dir = Path(__file__).parent
    patent_data_dir = current_dir / "patent_data"
    
    if not patent_data_dir.exists():
        logger.error(f"❌ Patent data directory not found: {patent_data_dir}")
        logger.error("Please ensure the patent_data directory exists with PDF files.")
        return False
    
    pdf_files = list(patent_data_dir.glob("*.pdf"))
    if not pdf_files:
        logger.error(f"❌ No PDF files found in {patent_data_dir}")
        logger.error("Please add PDF files to the patent_data directory.")
        return False
    
    logger.info(f"✅ Found {len(pdf_files)} PDF files in patent_data directory:")
    for pdf_file in pdf_files:
        logger.info(f"  - {pdf_file.name}")
    
    return True

def process_documents():
    """Process patent documents and create embeddings."""
    try:
        current_dir = Path(__file__).parent
        patent_data_dir = current_dir / "patent_data"
        output_pickle = current_dir / "patent_knowledge_base.pkl"
        
        logger.info("🚀 Starting patent document processing...")
        
        # Initialize processor
        processor = PatentDocumentProcessor()
        
        # Process documents
        logger.info("📄 Processing patent documents...")
        knowledge_base = processor.process_patent_documents(str(patent_data_dir))
        
        # Save to pickle
        logger.info("💾 Saving knowledge base to pickle file...")
        processor.save_to_pickle(knowledge_base, str(output_pickle))
        
        # Print summary
        metadata = knowledge_base['metadata']
        logger.info("✅ Patent document processing completed successfully!")
        logger.info(f"📊 Summary:")
        logger.info(f"  - Documents processed: {metadata['total_documents']}")
        logger.info(f"  - Total chunks created: {metadata['total_chunks']}")
        logger.info(f"  - Embedding model: {metadata['embedding_model']}")
        logger.info(f"  - Output file: {output_pickle}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error processing documents: {e}")
        return False

def install_dependencies():
    """Install required Python dependencies."""
    try:
        logger.info("📦 Checking Python dependencies...")
        
        # Check if requirements.txt exists in backend directory
        backend_dir = Path(__file__).parent.parent
        requirements_file = backend_dir / "requirements.txt"
        
        if not requirements_file.exists():
            logger.warning("⚠️  requirements.txt not found in backend directory")
            return True
        
        # Install dependencies
        logger.info("Installing dependencies from requirements.txt...")
        result = subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", str(requirements_file)
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            logger.info("✅ Dependencies installed successfully")
            return True
        else:
            logger.error(f"❌ Error installing dependencies: {result.stderr}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error installing dependencies: {e}")
        return False

def create_env_template():
    """Create environment template file if it doesn't exist."""
    current_dir = Path(__file__).parent
    env_example = current_dir / "env.example"
    
    if env_example.exists():
        logger.info("✅ env.example already exists")
        return
    
    env_template = """# Patent Document Processing Environment Variables
# Copy this file to .env and fill in your API keys

# OpenAI API Key (required for embeddings)
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Anthropic API Key (for future ChatBot integration)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional: Exa API Key (for web search integration)
EXA_API_KEY=your_exa_api_key_here
"""
    
    try:
        with open(env_example, 'w') as f:
            f.write(env_template)
        logger.info(f"✅ Created environment template: {env_example}")
    except Exception as e:
        logger.error(f"❌ Error creating env.example: {e}")

def main():
    """Main setup function."""
    print("🏗️  Patent Document Processing System Setup")
    print("=" * 50)
    
    # Step 1: Install dependencies
    # logger.info("Step 1: Installing dependencies...")
    # if not install_dependencies():
    #     logger.error("❌ Setup failed at dependency installation")
    #     return False
    
    # Step 2: Create environment template
    logger.info("Step 2: Creating environment template...")
    create_env_template()
    
    # Step 3: Check environment
    logger.info("Step 3: Checking environment variables...")
    if not check_environment():
        logger.error("❌ Setup failed at environment check")
        logger.info("💡 Please set up your .env file with the required API keys and run this script again.")
        return False
    
    # Step 4: Check patent data
    logger.info("Step 4: Checking patent data...")
    if not check_patent_data():
        logger.error("❌ Setup failed at patent data check")
        return False
    
    # Step 5: Process documents
    logger.info("Step 5: Processing patent documents...")
    if not process_documents():
        logger.error("❌ Setup failed at document processing")
        return False
    
    # Success!
    print("\n" + "=" * 50)
    print("🎉 Patent Document Processing System Setup Complete!")
    print("=" * 50)
    print("\n📋 What was created:")
    print("  ✅ Patent knowledge base with embeddings")
    print("  ✅ Pickle file with processed documents")
    print("  ✅ Environment template (if needed)")
    
    print("\n🚀 Next steps:")
    print("  1. You can now use the PatentRAGRetriever to search patent documents")
    print("  2. Run test_patent_system.py to verify everything works")
    print("  3. Integrate with your application using the patent_doc_processor module")
    
    current_dir = Path(__file__).parent
    pickle_file = current_dir / "patent_knowledge_base.pkl"
    print(f"\n📁 Knowledge base location: {pickle_file}")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
