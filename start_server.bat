@echo off
echo Starting Kinetics Messaging Server...

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Python is not installed. Please install Python 3.8 or higher.
    exit /b 1
)

REM Check if virtual environment exists
if not exist "server\kineticss_texting" (
    echo Creating virtual environment...
    python -m venv server\kineticss_texting
)

REM Activate virtual environment
call server\kineticss_texting\Scripts\activate

REM Install requirements
echo Installing dependencies...
pip install -r server\requirements.txt

REM Change to server directory
cd server

REM Initialize database
echo Initializing database...
python init_db.py

REM Start the Flask server
echo Starting Flask server...
python app.py

REM Deactivate virtual environment (not reached unless server is stopped)
call deactivate

echo Server stopped. 