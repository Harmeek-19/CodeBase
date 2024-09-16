import jwt
from datetime import datetime, timedelta
from flask import current_app
from app.models import User
from app import db

def generate_tokens(user_id):
    access_token = jwt.encode({
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(minutes=15)
    }, current_app.config['SECRET_KEY'], algorithm='HS256')
    
    refresh_token = jwt.encode({
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=30)
    }, current_app.config['SECRET_KEY'], algorithm='HS256')
    
    return access_token, refresh_token

def verify_token(token):
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def create_user(name, email, password):
    user = User(name=name, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return user

def verify_user(user_id):
    user = User.query.get(user_id)
    if user:
        user.is_verified = True
        db.session.commit()
        return True
    return False