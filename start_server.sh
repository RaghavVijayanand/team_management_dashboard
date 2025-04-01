#!/bin/bash

echo "Starting Kinetics Messaging Server..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "server/venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv server/venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source server/venv/bin/activate

# Install requirements
echo "Installing dependencies..."
pip install -r server/requirements.txt

# Change to server directory
cd server

# Initialize database
echo "Initializing database..."
python init_db.py

# Start the Flask server
echo "Starting Flask server..."
python app.py

# Deactivate virtual environment (not reached unless server is stopped)
deactivate

echo "Server stopped." 