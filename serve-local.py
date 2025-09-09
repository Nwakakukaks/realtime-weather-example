#!/usr/bin/env python3
"""
Local server for Daydream app to avoid CORS issues with Livepeer TV player.
Run this script to serve the app locally as recommended in the Daydream instructions.
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path

# Configuration
PORT = 8000
HOST = "localhost"

def main():
    # Change to the project directory
    project_dir = Path(__file__).parent
    os.chdir(project_dir)
    
    # Check if dist directory exists (Vite build output)
    if not (project_dir / "dist").exists():
        print("❌ Error: 'dist' directory not found!")
        print("Please run 'npm run build' first to create the production build.")
        sys.exit(1)
    
    # Change to dist directory to serve the built files
    os.chdir(project_dir / "dist")
    
    # Create a custom handler that serves files with proper CORS headers
    class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
        def end_headers(self):
            # Add CORS headers to allow Livepeer TV iframe
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            super().end_headers()
    
    # Start the server
    with socketserver.TCPServer((HOST, PORT), CORSHTTPRequestHandler) as httpd:
        print(f"🚀 Serving Daydream app at http://{HOST}:{PORT}")
        print(f"📁 Serving from: {os.getcwd()}")
        print("🎬 This avoids CORS issues with Livepeer TV player")
        print("⚠️  Press Ctrl+C to stop the server")
        print("-" * 50)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")
            sys.exit(0)

if __name__ == "__main__":
    main()
