#!/usr/bin/env python3
"""
Setup script for the legal document system.
Processes documents and sets up the legal chat API.
"""

import os
import sys
import subprocess
import logging
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def check_environment():
    """Check if required environment variables are set."""
    required_vars = [
        'OPENAI_API_KEY',
        'ANTHROPIC_API_KEY', 
        'EXA_API_KEY'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        logger.error("Missing required environment variables:")
        for var in missing_vars:
            logger.error(f"  - {var}")
        logger.error("Please copy env.example to .env and fill in your API keys")
        return False
    
    return True

def check_law_data():
    """Check if law_data directory exists and has PDF files."""
    law_data_path = Path("law_data")
    
    if not law_data_path.exists():
        logger.error("law_data directory not found")
        return False
    
    pdf_files = list(law_data_path.glob("*.pdf"))
    if not pdf_files:
        logger.error("No PDF files found in law_data directory")
        return False
    
    logger.info(f"Found {len(pdf_files)} PDF files in law_data directory:")
    for pdf_file in pdf_files:
        logger.info(f"  - {pdf_file.name}")
    
    return True

def process_documents():
    """Process legal documents and create embeddings."""
    logger.info("Processing legal documents...")
    
    try:
        from legal_doc_processor import LegalDocumentProcessor
        
        processor = LegalDocumentProcessor()
        knowledge_base = processor.process_legal_documents("law_data")
        processor.save_to_pickle(knowledge_base, "legal_knowledge_base.pkl")
        
        logger.info("✅ Legal documents processed successfully!")
        logger.info(f"   📚 Processed {knowledge_base['metadata']['total_documents']} documents")
        logger.info(f"   🧩 Created {knowledge_base['metadata']['total_chunks']} chunks")
        
        return True
    except Exception as e:
        logger.error(f"❌ Error processing documents: {e}")
        return False

def install_dependencies():
    """Install required dependencies."""
    logger.info("Installing dependencies...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
        logger.info("✅ Dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Error installing dependencies: {e}")
        return False

def main():
    """Main setup function."""
    logger.info("🚀 Setting up Legal Document System")
    logger.info("=" * 50)
    
    # Check environment
    if not check_environment():
        logger.error("❌ Environment check failed")
        # return False
    
    # Check law data
    if not check_law_data():
        logger.error("❌ Law data check failed")
        return False
    
    # Install dependencies
    # if not install_dependencies():
    #     logger.error("❌ Dependency installation failed")
    #     return False
    
    # Process documents
    if not process_documents():
        logger.error("❌ Document processing failed")
        return False
    
    logger.info("🎉 Legal system setup completed successfully!")
    logger.info("")
    logger.info("Next steps:")
    logger.info("1. Start the API server: python legal_chat_api.py")
    logger.info("2. Test the API at: http://localhost:8000")
    logger.info("3. View API docs at: http://localhost:8000/docs")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
