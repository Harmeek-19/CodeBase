import requests
from flask import current_app

def gather_data_from_github(api_url):
    github_data = []
    try:
        response = requests.get(api_url)
        response.raise_for_status()
        items = response.json()['items']
        for item in items:
            name_or_title = item['name']
            url = item['html_url']
            language = item.get('language', 'Unknown')
            code = item.get('content', '')  # You might need to fetch this separately
            stars = item.get('stargazers_count', 0)
            github_data.append({
                'source': 'GitHub',
                'name_or_title': name_or_title,
                'url': url,
                'language': language,
                'code': code,
                'stars': stars
            })
        current_app.logger.info(f"Successfully gathered {len(github_data)} items from GitHub")
    except requests.RequestException as e:
        current_app.logger.error(f"Error fetching data from GitHub: {str(e)}")
    return github_data