import secrets
import string

def generate_api_key(length=32):
    characters = string.ascii_letters + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))

api_key = generate_api_key()
print(f"Your API key: {api_key}")