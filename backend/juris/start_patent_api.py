#!/usr/bin/env python3
"""
Patent API Startup Script
Easy way to start the Patent Search API server with proper configuration.
"""

import os
import sys
import subprocess
import logging
from pathlib import Path
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def check_requirements():
    """Check if the system is ready to run the API."""
    print("🔍 Checking Patent API Requirements...")
    
    # Check if knowledge base exists
    current_dir = Path(__file__).parent
    kb_file = current_dir / "patent_knowledge_base.pkl"
    
    if not kb_file.exists():
        print("❌ Patent knowledge base not found!")
        print("📋 Please run the setup first:")
        print("   python setup_patent_system.py")
        return False
    
    print("✅ Patent knowledge base found")
    
    # Check environment variables
    load_dotenv()
    
    if not os.getenv("OPENAI_API_KEY"):
        print("⚠️  OPENAI_API_KEY not found - required for embeddings")
        print("📋 Please add OPENAI_API_KEY to your .env file")
        return False
    
    print("✅ OpenAI API key configured")
    
    if not os.getenv("EXA_API_KEY"):
        print("⚠️  EXA_API_KEY not found - web search will be disabled")
        print("💡 Add EXA_API_KEY to your .env file to enable web search")
    else:
        print("✅ Exa API key configured")
    
    return True

def start_api_server(host="0.0.0.0", port=8001, reload=False):
    """Start the Patent API server."""
    try:
        import uvicorn
        
        print(f"🚀 Starting Patent Search API on {host}:{port}")
        print(f"📚 API Documentation: http://localhost:{port}/docs")
        print(f"🔍 Health Check: http://localhost:{port}/")
        print("Press Ctrl+C to stop the server")
        print("=" * 60)
        
        # Start the server
        uvicorn.run(
            "patent_api:app",
            host=host,
            port=port,
            reload=reload,
            log_level="info",
            access_log=True
        )
        
    except ImportError:
        print("❌ uvicorn not installed. Installing...")
        subprocess.run([sys.executable, "-m", "pip", "install", "uvicorn"], check=True)
        print("✅ uvicorn installed. Please run the script again.")
    except KeyboardInterrupt:
        print("\n👋 Patent API server stopped")
    except Exception as e:
        print(f"❌ Error starting server: {e}")

def show_usage():
    """Show usage information."""
    print("🚀 Patent Search API Startup")
    print("=" * 40)
    print("Usage: python start_patent_api.py [options]")
    print()
    print("Options:")
    print("  --check     Check requirements only")
    print("  --reload    Start with auto-reload (development)")
    print("  --port NUM  Specify port (default: 8001)")
    print("  --host HOST Specify host (default: 0.0.0.0)")
    print("  --help      Show this help message")
    print()
    print("Examples:")
    print("  python start_patent_api.py                # Start production server")
    print("  python start_patent_api.py --reload       # Start with auto-reload")
    print("  python start_patent_api.py --port 8080    # Start on port 8080")
    print("  python start_patent_api.py --check        # Check requirements only")

def main():
    """Main startup function."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Start Patent Search API")
    parser.add_argument("--check", action="store_true", help="Check requirements only")
    parser.add_argument("--reload", action="store_true", help="Start with auto-reload")
    parser.add_argument("--port", type=int, default=8001, help="Port to run on")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to")
    parser.add_argument("--help-usage", action="store_true", help="Show detailed usage")
    
    args = parser.parse_args()
    
    if args.help_usage:
        show_usage()
        return
    
    # Check requirements
    if not check_requirements():
        print("\n❌ Requirements check failed. Please fix the issues above.")
        return False
    
    if args.check:
        print("\n✅ All requirements satisfied! Ready to start API.")
        return True
    
    # Start the server
    start_api_server(
        host=args.host,
        port=args.port,
        reload=args.reload
    )
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
