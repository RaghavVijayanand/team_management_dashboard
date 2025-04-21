#!/usr/bin/env python
# Setup script for Gemini API integration

import os
import sys
import subprocess
import platform

# Gemini API key
GEMINI_API_KEY = "AIzaSyA4_WitozXaB1EISpjm68RzsV5Wj3N8UI0"

def setup_environment():
    """Set up the environment with the Gemini API key"""
    print("Setting up environment for Gemini API integration...")
    
    # Determine the correct command to set environment variables based on platform
    if platform.system() == "Windows":
        # Set environment variable for the current process
        os.environ["GEMINI_API_KEY"] = GEMINI_API_KEY
        
        # Output command for user to set environment variable permanently
        print("\nTo set the Gemini API key permanently, run the following command in PowerShell:")
        print(f'[Environment]::SetEnvironmentVariable("GEMINI_API_KEY", "{GEMINI_API_KEY}", "User")')
    else:
        # Set environment variable for the current process
        os.environ["GEMINI_API_KEY"] = GEMINI_API_KEY
        
        # Output commands for user to set environment variable permanently
        print("\nTo set the Gemini API key permanently, run one of the following commands:")
        print(f'echo \'export GEMINI_API_KEY="{GEMINI_API_KEY}"\' >> ~/.bashrc')
        print("OR")
        print(f'echo \'export GEMINI_API_KEY="{GEMINI_API_KEY}"\' >> ~/.zshrc')
    
    print("\nEnvironment variable set for the current process.")

def install_dependencies():
    """Install the required dependencies"""
    print("Installing required dependencies...")
    
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "google-generativeai==0.3.1"])
        print("Dependencies installed successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Error installing dependencies: {e}")
        print("Please manually install the required package with:")
        print("pip install google-generativeai==0.3.1")
        return False
    
    return True

def verify_installation():
    """Verify that the Gemini API is working"""
    print("\nVerifying Gemini API installation...")
    
    try:
        import google.generativeai as genai
        
        # Configure the API key
        genai.configure(api_key=GEMINI_API_KEY)
        
        # Test the API with a simple prompt
        model = genai.GenerativeModel(model_name="gemini-2.0-flash-lite")
        response = model.generate_content("Hello Gemini! Please respond with a very short greeting.")
        
        print("\nGemini API test response:")
        print(response.text)
        print("\nGemini API is working correctly!")
        return True
    except ImportError:
        print("Failed to import the google.generativeai module.")
        print("Please make sure it's installed correctly.")
        return False
    except Exception as e:
        print(f"Error when testing Gemini API: {e}")
        print("Please check your API key and internet connection.")
        return False

def main():
    """Main function"""
    print("=" * 60)
    print("Gemini API Setup for Kinetics Chat")
    print("=" * 60)
    
    # Install dependencies
    if not install_dependencies():
        print("\nSetup incomplete due to installation errors.")
        return
    
    # Set up environment
    setup_environment()
    
    # Verify installation
    if verify_installation():
        print("\nSetup completed successfully!")
        print("You can now use the Gemini API for text summarization in the chat application.")
    else:
        print("\nSetup incomplete due to verification errors.")

if __name__ == "__main__":
    main() 