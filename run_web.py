#!/usr/bin/env python3
"""
Convenience script to run the web interface.

This script makes it easy to start the web interface with proper error handling.
"""

import os
import sys
import subprocess
from pathlib import Path


def check_dependencies():
    """Check if required dependencies are installed."""
    try:
        import flask
        import openai
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("\n💡 Install dependencies with:")
        print("   pip install -r requirements.txt")
        return False


def check_api_key():
    """Check if OpenAI API key is set."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ OPENAI_API_KEY environment variable not set")
        print("\n💡 Set your API key with:")
        print("   export OPENAI_API_KEY='your-api-key-here'")
        print("\n   Or create a .env file with:")
        print("   OPENAI_API_KEY=your-api-key-here")
        return False
    return True


def main():
    """Main function to run the web interface."""
    print("🌐 Starting LLM Wrapper Web Interface")
    print("=" * 50)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Check API key
    if not check_api_key():
        sys.exit(1)
    
    # Get the web app path
    web_app_path = Path(__file__).parent / "web" / "app.py"
    
    if not web_app_path.exists():
        print(f"❌ Web app not found at {web_app_path}")
        sys.exit(1)
    
    print("✅ All checks passed!")
    print("\n🚀 Starting web server...")
    print("📍 Web interface will be available at: http://localhost:5000")
    print("🛑 Press Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        # Run the Flask app
        subprocess.run([sys.executable, str(web_app_path)], check=True)
    except KeyboardInterrupt:
        print("\n\n👋 Web server stopped. Goodbye!")
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Error running web server: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
