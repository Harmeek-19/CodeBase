import requests
from bs4 import BeautifulSoup
import google.generativeai as genai
from flask import current_app
import time
import re
import base64
def setup_gemini():
    genai.configure(api_key=current_app.config['GEMINI_API_KEY'])
    return genai.GenerativeModel('gemini-pro')


import requests
import base64
from flask import current_app

import requests
import base64
from flask import current_app

def fetch_repository_content(repo_url):
    try:
        if not repo_url:
            raise ValueError("Repository URL is empty")

        # Extract owner and repo name from URL
        parts = repo_url.split('/')
        if len(parts) < 5 or 'github.com' not in parts:
            raise ValueError(f"Invalid GitHub repository URL: {repo_url}")
        
        owner, repo = parts[-2], parts[-1]
        current_app.logger.info(f"Fetching content for repository: {owner}/{repo}")

        # Fetch README content
        readme_url = f"https://api.github.com/repos/{owner}/{repo}/readme"
        readme_response = requests.get(readme_url)
        if readme_response.status_code == 200:
            readme_content = base64.b64decode(readme_response.json()['content']).decode('utf-8')
            current_app.logger.info(f"Successfully fetched README for {owner}/{repo}")
        else:
            readme_content = f"README not found. Status code: {readme_response.status_code}"
            current_app.logger.warning(f"Failed to fetch README for {owner}/{repo}. Status code: {readme_response.status_code}")

        # Fetch file structure
        contents_url = f"https://api.github.com/repos/{owner}/{repo}/contents"
        contents_response = requests.get(contents_url)
        if contents_response.status_code == 200:
            file_structure = [item['path'] for item in contents_response.json()]
            current_app.logger.info(f"Successfully fetched file structure for {owner}/{repo}")
        else:
            file_structure = []
            current_app.logger.warning(f"Failed to fetch file structure for {owner}/{repo}. Status code: {contents_response.status_code}")

        return {
            "readme": readme_content,
            "file_structure": file_structure
        }
    except Exception as e:
        current_app.logger.error(f"Error fetching repository content: {str(e)}", exc_info=True)
        return {"error": f"Failed to fetch repository content: {str(e)}"}

def generate_documentation(data):
    model = setup_gemini()
    
    if 'code' in data:
        prompt = create_code_prompt(data)
    elif 'repo_url' in data:
        repo_content = fetch_repository_content(data['repo_url'])
        prompt = create_repo_prompt(data['repo_url'], repo_content)
    else:
        raise ValueError("Invalid data provided for documentation generation")

    retries = 5
    for i in range(retries):
        try:
            response = model.generate_content(prompt)
            
            if response.text:
                return post_process_documentation(response.text)
            else:
                current_app.logger.error("Empty response from Gemini API")
                return "Error: Empty response from AI model."
        
        except Exception as e:
            if i < retries - 1:
                wait_time = 2 ** i
                current_app.logger.warning(f"Gemini API error. Retrying in {wait_time} seconds... Error: {str(e)}")
                time.sleep(wait_time)
            else:
                current_app.logger.error(f"Max retries exceeded for Gemini API: {str(e)}")
                return f"Error: Failed to generate documentation. {str(e)}"
    
    return "Error: Failed to generate documentation after multiple attempts."

def create_code_prompt(data):
    return f"""Generate comprehensive documentation for the following code snippet:

Name/Title: {data.get('name_or_title', 'N/A')}
Language: {data.get('language', 'N/A')}
Code:
{data.get('code', 'No code provided')}

Documentation should include:
1. A brief description of the code's purpose
2. Key components, functions, or classes and their roles
3. Input parameters and return values (if applicable)
4. Any notable technologies, frameworks, or libraries used
5. Usage examples
6. Any important notes or considerations for users/developers
"""

def create_repo_prompt(repo_url, repo_content):
    return f"""Generate comprehensive documentation for the following GitHub repository:

Repository URL: {repo_url}

README Content:
{repo_content['readme']}

File Structure:
{', '.join(repo_content['file_structure'])}

Documentation should include:
1. A brief description of the repository's purpose and main functionality
2. Key components or modules and their roles
3. Main technologies, frameworks, or libraries used
4. Installation and setup instructions (if available in the README)
5. Usage examples or API endpoints (if it's a library or service)
6. Any important notes or considerations for users/developers
"""

def post_process_documentation(raw_doc):
    # Remove any repetition of the prompt
    cleaned_doc = re.sub(r'^.*?Documentation should include:', '', raw_doc, flags=re.DOTALL).strip()
    
    # Remove any mentions of formatting instructions
    cleaned_doc = re.sub(r'Please format the documentation in .*?\.', '', cleaned_doc, flags=re.DOTALL).strip()
    
    # Ensure headers are properly formatted
    cleaned_doc = re.sub(r'^(?!#)(.+)\n={3,}', r'# \1', cleaned_doc, flags=re.MULTILINE)
    cleaned_doc = re.sub(r'^(?!##)(.+)\n-{3,}', r'## \1', cleaned_doc, flags=re.MULTILINE)
    
    # Ensure code blocks are properly formatted
    cleaned_doc = re.sub(r'```(\w+)?\n', r'\n```\1\n', cleaned_doc)
    cleaned_doc = re.sub(r'\n```\s*\n', r'\n```\n\n', cleaned_doc)
    
    return cleaned_doc.strip()