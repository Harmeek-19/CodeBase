from app import celery, db
from app.models.code_snippet import CodeSnippet
from app.services.ai_service import generate_documentation

@celery.task
def generate_documentation_task(snippet_id):
    snippet = CodeSnippet.query.get(snippet_id)
    if snippet:
        documentation = generate_documentation(snippet.to_dict())
        snippet.documentation = documentation
        db.session.commit()
    return f"Documentation generated for snippet {snippet_id}"