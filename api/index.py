import os
import sys

# Ensure project root is in sys.path so backend modules are discovered
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app

# Expose app for Vercel's WSGI/ASGI Python serverless handler
__all__ = ["app"]
