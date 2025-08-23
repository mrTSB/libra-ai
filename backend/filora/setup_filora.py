#!/usr/bin/env python3
"""
Setup script for Filora Agent.
Installs Selenium and required dependencies.
"""

import subprocess
import sys
import os
from pathlib import Path


def run_command(command: str, description: str):
    """Run a command and handle errors."""
    print(f"🔄 {description}...")
    
    try:
        result = subprocess.run(
            command,
            shell=True,
            check=True,
            capture_output=True,
            text=True
        )
        print(f"✅ {description} completed successfully")
        return result
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"   Command: {command}")
        print(f"   Error: {e.stderr}")
        sys.exit(1)


def main():
    """Set up Filora Agent environment."""
    print("🤖 Setting up Filora Agent...")
    
    # Get the backend directory
    backend_dir = Path(__file__).parent.parent
    os.chdir(backend_dir)
    
    print(f"📁 Working directory: {backend_dir}")
    
    # Install Python dependencies using uv (preferred) or pip
    if subprocess.run(["which", "uv"], capture_output=True).returncode == 0:
        print("📦 Using uv for dependency management...")
        run_command("uv pip install -r requirements.txt", "Installing Python dependencies with uv")
    else:
        print("📦 Using pip for dependency management...")
        run_command("pip3 install -r requirements.txt", "Installing Python dependencies with pip")
    
    print("\n🎉 Filora Agent setup completed successfully!")
    print("\n📋 Next steps:")
    print("   1. Start the agent: python3 backend/filora/filora_api.py")
    print("   2. Or use uvicorn: uvicorn filora.filora_api:app --host 0.0.0.0 --port 8000 --reload")
    print("   3. Visit http://localhost:8000/docs for API documentation")
    print("   4. Test with: python3 backend/filora/test_filora.py")


if __name__ == "__main__":
    main()
