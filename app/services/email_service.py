from flask import url_for
from flask_mail import Message
from app import mail

def send_verification_email(user):
    msg = Message('Verify Your Email',
                  sender='noreply@codebase.com',
                  recipients=[user.email])
    msg.body = f'''To verify your email, please click on the following link:
{url_for('api.verify', user_id=user.id, _external=True)}

If you did not make this request then simply ignore this email and no changes will be made.
'''
    mail.send(msg)