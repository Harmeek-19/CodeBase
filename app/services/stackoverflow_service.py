import requests
from flask import current_app

def gather_data_from_stackoverflow(api_url):
    stackoverflow_data = []
    try:
        response = requests.get(api_url)
        response.raise_for_status()
        items = response.json()['items']
        for item in items:
            name_or_title = item['title']
            url = item['link']
            code = item.get('body', '')  # This might contain the code, but you may need to parse it
            language = item.get('tags', ['Unknown'])[0]  # Assuming the first tag is the language
            stars = item.get('score', 0)
            stackoverflow_data.append({
                'source': 'StackOverflow',
                'name_or_title': name_or_title,
                'url': url,
                'language': language,
                'code': code,
                'stars': stars
            })
        current_app.logger.info(f"Successfully gathered {len(stackoverflow_data)} items from StackOverflow")
    except requests.RequestException as e:
        current_app.logger.error(f"Error fetching data from StackOverflow: {str(e)}")
    return stackoverflow_data