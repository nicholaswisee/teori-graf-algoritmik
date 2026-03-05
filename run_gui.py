#!/usr/bin/env python
"""Entry point: run the graph algorithm visualizer GUI."""
import sys
import os

# Ensure project root is on path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from gui.app import app

if __name__ == "__main__":
    print("\n  Graph Algorithm Visualizer")
    print("  Open: http://localhost:5000\n")
    app.run(debug=True, port=5000)
