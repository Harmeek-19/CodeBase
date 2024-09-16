from app import db
from datetime import datetime

class CodeSnippet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'))
    url = db.Column(db.String(500))
    name_or_title = db.Column(db.String(255))
    language = db.Column(db.String(50))
    code = db.Column(db.Text)
    stars = db.Column(db.Integer, default=0)
    source = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_user_submitted = db.Column(db.Boolean, default=False)
    has_documentation = db.Column(db.Boolean, default=False)
    is_repo = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'project_id': self.project_id,
            'url': self.url,
            'name_or_title': self.name_or_title,
            'language': self.language,
            'code': self.code,
            'stars': self.stars,
            'source': self.source,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_user_submitted': self.is_user_submitted,
            'has_documentation': self.has_documentation,
            'is_repo': self.is_repo
        }