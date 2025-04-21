#!/usr/bin/env python
# Setup script for DeepL API integration

import os
import sys
import subprocess
import platform
import requests
import time

def setup_environment():
    """Set up the environment with the DeepL API key"""
    print("\n=== DeepL API Key Configuration ===")
    
    # Check if API key is already set
    existing_key = os.environ.get("DEEPL_API_KEY")
    if existing_key:
        print(f"Found existing DeepL API key: {existing_key[:4]}{'*' * (len(existing_key) - 4)}")
        change_key = input("Do you want to update this key? (y/n): ").lower()
        if change_key != 'y':
            return existing_key
    
    # Prompt for API key
    api_key = input("\nEnter your DeepL API key (get one from https://www.deepl.com/pro-api): ")
    
    if not api_key:
        print("No API key provided. Setup cannot continue.")
        return None
    
    # Set environment variable for the current process
    os.environ["DEEPL_API_KEY"] = api_key
    
    # Output commands for user to set environment variable permanently
    print("\nTo set the DeepL API key permanently, run one of the following commands:")
    
    if platform.system() == "Windows":
        print(f'\n[Environment]::SetEnvironmentVariable("DEEPL_API_KEY", "{api_key}", "User")')
    else:
        print(f'\necho \'export DEEPL_API_KEY="{api_key}"\' >> ~/.bashrc')
        print("OR")
        print(f'echo \'export DEEPL_API_KEY="{api_key}"\' >> ~/.zshrc')
    
    print("\nEnvironment variable set for the current process.")
    return api_key

def verify_api_key(api_key):
    """Verify that the DeepL API key works"""
    print("\n=== Verifying DeepL API Key ===")
    
    if not api_key:
        print("No API key to verify.")
        return False
    
    try:
        # Use DeepL API to test translation
        url = "https://api-free.deepl.com/v2/translate"
        headers = {
            "Authorization": f"DeepL-Auth-Key {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "text": ["Hello, this is a test message."],
            "target_lang": "ES"  # Translate to Spanish
        }
        
        print("Testing API with a simple translation...")
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            translated_text = data.get('translations', [{}])[0].get('text', '')
            
            if translated_text:
                print("\n✅ Success! Your DeepL API key is working correctly.")
                print(f"Test translation: 'Hello, this is a test message.' → '{translated_text}'")
                return True
            else:
                print("⚠️ API responded but no translation was returned.")
                return False
        else:
            print(f"⚠️ API test failed with status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    
    except Exception as e:
        print(f"⚠️ Error testing DeepL API: {e}")
        return False

def update_requirements():
    """Make sure requests is installed for API calls"""
    try:
        print("\n=== Checking dependencies ===")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"])
        print("✅ Dependencies are installed correctly.")
        return True
    except Exception as e:
        print(f"⚠️ Error installing dependencies: {e}")
        print("Please manually install the required package: pip install requests")
        return False

def main():
    print("\n" + "=" * 60)
    print("DeepL API Setup for Kinetics Chat Translation")
    print("=" * 60)
    
    # Make sure requirements are installed
    if not update_requirements():
        print("\nSetup incomplete due to missing dependencies.")
        return
    
    # Set up environment
    api_key = setup_environment()
    if not api_key:
        print("\nSetup incomplete due to missing API key.")
        return
    
    # Give the user time to read the instructions
    time.sleep(1)
    
    # Verify the API key
    if verify_api_key(api_key):
        print("\n🎉 Setup completed successfully!")
        print("You can now use DeepL translation in the chat application.")
        print("\nRestart the server for changes to take effect.")
    else:
        print("\n⚠️ Setup incomplete. The API key could not be verified.")
        print("Please check your API key and internet connection.")

if __name__ == "__main__":
    main() 