from typing import List, Dict, Set

def clean_data(data: List[Dict[str, str]]) -> List[Dict[str, str]]:
    cleaned_data: List[Dict[str, str]] = []
    seen_urls: Set[str] = set()

    for item in data:
        url = item.get('url')
        if url and url not in seen_urls:
            seen_urls.add(url)
            name_or_title = item.get('name_or_title', '').strip().title()
            cleaned_data.append({
                'source': item['source'],
                'name_or_title': name_or_title,
                'url': url
            })

    return cleaned_data

import secrets
import string

def generate_api_key(length=32):
    characters = string.ascii_letters + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))