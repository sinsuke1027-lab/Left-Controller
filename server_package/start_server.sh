#!/bin/bash

# Clear screen
clear

echo "=================================================="
echo "  Starting Left Device Server..."
echo "=================================================="

# Check for Python3
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python3 is not installed."
    echo "Please install Python3 from https://www.python.org/"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "[INFO] Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
if [ -f "requirements.txt" ]; then
    echo "[INFO] Installing requirements..."
    pip install -r requirements.txt
fi

# Run the server
echo "[INFO] Launching server..."
python main.py
