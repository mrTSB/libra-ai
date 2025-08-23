#!/usr/bin/env python3
"""
Main entry point for Sage API server.
Run this from the backend directory: python -m sage.main
"""

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        host="0.0.0.0",
        port=8002,
        log_level="info",
        reload=True,
    )
