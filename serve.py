#!/usr/bin/env python3
"""
Bangle.js 2 UI Designer - Local Web Server & Launcher
Starts a local web server with zero external dependencies and opens the UI Designer in your browser.
"""

import sys
import os
import socket
import argparse
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT_DEFAULT = 8080


def find_free_port(start_port=PORT_DEFAULT, max_attempts=20):
    for port in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    return start_port


def run_server(port, open_browser=True):
    # Ensure current directory is the repo root
    repo_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(repo_dir)

    target_port = find_free_port(port)
    url = f"http://localhost:{target_port}/ui-designer/index.html"

    handler = SimpleHTTPRequestHandler

    print("=" * 65)
    print("  ⌚  Bangle.js 2 UI Designer & Studio")
    print("=" * 65)
    print(f"  Local Server:  http://localhost:{target_port}/")
    print(f"  Direct Link:   {url}")
    print("=" * 65)
    print("  Controls:")
    print("    - Press Ctrl+C in this terminal to stop the server.")
    print("    - Connect directly to your Bangle.js 2 over Web Bluetooth.")
    print("=" * 65)

    if open_browser:
        print("\nOpening Bangle.js 2 UI Studio in your default browser...")
        webbrowser.open(url)

    try:
        with HTTPServer(("127.0.0.1", target_port), handler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped. Happy hacking on Bangle.js 2!")
        sys.exit(0)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Launch Bangle.js 2 UI Studio")
    parser.add_argument("--port", type=int, default=PORT_DEFAULT, help="Port to listen on (default 8080)")
    parser.add_argument("--no-browser", action="store_true", help="Do not open browser automatically")
    args = parser.parse_args()

    run_server(args.port, open_browser=not args.no_browser)

