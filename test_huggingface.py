# test_huggingface.py
import os
from dotenv import load_dotenv
from app.services.ai_service import generate_documentation

load_dotenv()

class MockApp:
    config = {'HUGGINGFACE_API_KEY': os.getenv('HUGGINGFACE_API_KEY')}

class MockCurrentApp:
    @staticmethod
    def logger():
        import logging
        return logging.getLogger()

if __name__ == "__main__":
    from flask import current_app
    current_app = MockCurrentApp()
    
    test_snippet = {
        'name_or_title': 'Test Function',
        'url': 'https://example.com/test',
        'source': 'Test'
    }
    
    try:
        documentation = generate_documentation(test_snippet)
        print("Generated Documentation:")
        print(documentation)
    except Exception as e:
        print(f"Error: {str(e)}")