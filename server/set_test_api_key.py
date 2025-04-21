#!/usr/bin/env python
# Set a test DeepL API key for debugging purposes

import os
import sys
import json

# A placeholder API key for testing - to be replaced with a real one by the user
TEST_API_KEY = 'test_deepl_api_key_for_debugging'

def set_test_key():
    print("Setting a test DeepL API key for debugging purposes...")
    print(f"API Key: '{TEST_API_KEY}'")
    
    # Create a .env file with the key
    with open(os.path.join(os.path.dirname(__file__), '.env'), 'w') as f:
        f.write(f"DEEPL_API_KEY={TEST_API_KEY}\n")
    
    # Also set it for the current process
    os.environ['DEEPL_API_KEY'] = TEST_API_KEY
    
    print("Test API key has been set. The server will now use this key.")
    print("")
    print("IMPORTANT: In a production environment, replace this with your real DeepL API key.")
    print("Get a free API key from: https://www.deepl.com/pro-api")
    
    # Create a dotenv loading snippet to add to app.py
    print("\nAdd the following code near the top of app.py (after imports):")
    print("-" * 60)
    print("# Load environment variables from .env file")
    print("from dotenv import load_dotenv")
    print("load_dotenv()  # This loads the .env file into os.environ")
    print("-" * 60)

if __name__ == "__main__":
    set_test_key()
    print("\nDone! Now modify the translation endpoint to handle missing/invalid API keys gracefully.") 