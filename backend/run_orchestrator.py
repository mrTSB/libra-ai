#!/usr/bin/env python3
"""
Quick script to run the Libra AI Orchestrator from the backend directory.
"""

import subprocess
import sys
import os
from pathlib import Path

def main():
    """Run the orchestrator from the backend directory."""
    # Get the path to the orchestrator directory
    backend_dir = Path(__file__).parent
    orchestrator_dir = backend_dir / "orchestrator"
    
    if not orchestrator_dir.exists():
        print("❌ Orchestrator directory not found!")
        print(f"Expected path: {orchestrator_dir}")
        return
    
    # Change to the orchestrator directory
    os.chdir(orchestrator_dir)
    
    print("🚀 Starting Libra AI Orchestrator (LLM-Powered)...")
    print(f"📁 Working directory: {orchestrator_dir}")
    print("🤖 Using LLM-powered intelligent routing...")
    print()
    
    # Run the orchestrator
    try:
        subprocess.run([
            sys.executable, "orchestrator.py"
        ], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Orchestrator stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running orchestrator: {e}")
    except FileNotFoundError:
        print("❌ Could not find orchestrator.py")
        print("💡 Make sure you're in the correct directory")

if __name__ == "__main__":
    main()
