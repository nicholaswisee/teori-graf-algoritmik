import sys
import os

# Add project root to path so gui/ and src/ imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from gui.app import app

# Vercel serverless handler
# The Flask app is already created in gui/app.py
