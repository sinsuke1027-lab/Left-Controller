@echo off
title Left Device Server
cls

echo ==================================================
echo   Starting Left Device Server...
echo ==================================================

REM Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python from https://www.python.org/
    pause
    exit /b
)

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo [INFO] Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate

REM Install dependencies
if exist "requirements.txt" (
    echo [INFO] Installing requirements...
    pip install -r requirements.txt >nul 2>&1
)

REM Run the server
echo [INFO] Launching server...
python main.py

pause
