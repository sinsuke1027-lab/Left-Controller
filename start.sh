#!/bin/bash

# Function to kill processes on exit
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup INT

echo "=== Left-Device Startup ==="

# Check Backend
if [ ! -d "backend/venv" ]; then
    echo "Initializing Backend Environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
fi

# Start Backend
echo "Starting Backend Server (Port 8002)..."
cd backend
source venv/bin/activate
python3 server.py &
BACKEND_PID=$!
cd ..

# Start Frontend
echo "Starting Frontend Server (Port 3001)..."
cd frontend
# Check if node_modules exists, simple check
if [ ! -d "node_modules" ]; then
    echo "Installing Frontend Dependencies..."
    npm install
fi
npm run dev &
FRONTEND_PID=$!
cd ..

# Attempt to detect local IP (Mac/Linux specific)
IP_ADDR=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
if [ -z "$IP_ADDR" ]; then
    # Fallback using python if shell command fails or on different OS
    IP_ADDR=$(python3 -c 'import socket; print(socket.gethostbyname(socket.gethostname()))' 2>/dev/null)
fi
if [ -z "$IP_ADDR" ]; then
    IP_ADDR="<YOUR-PC-IP>"
fi

echo "=================================================="
echo "   App is running!"
echo "   > Local:   http://localhost:3001"
echo "   > Network: http://$IP_ADDR:3001  (Open this on Tablet)"
echo "=================================================="

# Show QR Code
cd backend
# Check if qrcode is installed
if ! python3 -c "import qrcode" 2>/dev/null; then
    echo "Installing QR code support..."
    pip install qrcode > /dev/null
fi
echo "Scan to Connect:"
python3 show_qr.py "http://$IP_ADDR:3001"
cd ..

echo "=================================================="
echo "Press Ctrl+C to stop."

wait
