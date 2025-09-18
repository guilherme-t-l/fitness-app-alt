#!/bin/bash

# LLM Wrapper Local Deployment Script
# This script sets up and runs the LLM wrapper web application locally

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

print_status "Starting LLM Wrapper deployment..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
REQUIRED_VERSION="3.8"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    print_error "Python $RETHON_VERSION is installed, but Python $REQUIRED_VERSION or higher is required."
    exit 1
fi

print_success "Python $PYTHON_VERSION detected"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_status "Creating virtual environment..."
    python3 -m venv venv
    print_success "Virtual environment created"
else
    print_status "Virtual environment already exists"
fi

# Activate virtual environment
print_status "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
print_status "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
print_status "Installing dependencies..."
pip install -r requirements.txt

# Install the package in development mode
print_status "Installing LLM wrapper package..."
pip install -e .

print_success "Dependencies installed successfully"

# Check if .env file exists, create if not
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating template..."
    cat > .env << EOF
# Anthropic API Key (required)
ANTHROPIC_API_KEY=your_anthropic_api_key_here


EOF
    print_warning "Please edit .env file and add your API keys before running the application."
    print_warning "You can get an Anthropic API key from: https://console.anthropic.com/"
    echo ""
    read -p "Press Enter to continue after adding your API key to .env file..."
fi

# Check if API key is set
if ! grep -q "ANTHROPIC_API_KEY=sk-" .env 2>/dev/null; then
    print_error "ANTHROPIC_API_KEY not properly set in .env file."
    print_error "Please edit .env file and add your Anthropic API key."
    exit 1
fi

print_success "Configuration validated"

# Create logs directory if it doesn't exist
mkdir -p logs

# Start the application
print_status "Starting LLM Wrapper web application..."
print_status "The application will be available at: http://localhost:5000"
print_status "Press Ctrl+C to stop the application"
echo ""

# Run the Flask application
python web/app.py
