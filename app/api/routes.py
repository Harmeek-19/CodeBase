from datetime import datetime
from functools import wraps
import celery
from flask import current_app, jsonify, request, url_for
from app import db, mail
from app.models.code_snippet import CodeSnippet
from app.models.documentation import Documentation, Project, Correction
from app.models.user import User
from app.models.api_key import APIKey
from app.api import api
from app.services.github_service import gather_data_from_github
from app.services.stackoverflow_service import gather_data_from_stackoverflow
from app.services.ai_service import fetch_repository_content, generate_documentation
from app.services.auth_service import create_user, generate_tokens, verify_token, verify_user
from app.tasks import generate_documentation_task
from app.utils.helpers import clean_data, generate_api_key
from config.config import Config
from flask_mail import Message
from sqlalchemy.exc import OperationalError
import time
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

def require_api_key(view_function):
    @wraps(view_function)
    def decorated_function(*args, **kwargs):
        provided_key = request.headers.get('X-API-Key')
        if not provided_key:
            return jsonify({"error": "API Key is missing"}), 401
        api_key = APIKey.query.filter_by(key=provided_key).first()
        if api_key:
            api_key.last_used = datetime.utcnow()
            db.session.commit()
            return view_function(*args, **kwargs)
        else:
            return jsonify({"error": "Invalid API Key"}), 403
    return decorated_function

def require_auth(view_function):
    @wraps(view_function)
    def decorated_function(*args, **kwargs):
        access_token = request.headers.get('Authorization')
        if not access_token:
            return jsonify({'message': 'Access token is missing.'}), 401
        
        user_id = verify_token(access_token.split()[1])
        if not user_id:
            return jsonify({'message': 'Invalid access token.'}), 401
        
        return view_function(user_id, *args, **kwargs)
    return decorated_function

@api.route('/signup', methods=['POST'])
@limiter.limit("5 per minute")
def signup():
    data = request.json
    try:
        user = create_user(data['name'], data['email'], data['password'])
        
        msg = Message('Verify Your Email',
                      sender='noreply@codebase.com',
                      recipients=[user.email])
        msg.body = f'''To verify your email, please click on the following link:
    {url_for('api.verify', user_id=user.id, _external=True)}

    If you did not make this request then simply ignore this email and no changes will be made.
    '''
        mail.send(msg)
        
        return jsonify({'message': 'User created. Please check your email for verification.'}), 201
    except Exception as e:
        current_app.logger.error(f"Error in signup: {str(e)}")
        return jsonify({'message': 'An error occurred during signup.'}), 500

@api.route('/verify/<int:user_id>', methods=['GET'])
def verify(user_id):
    if verify_user(user_id):
        return jsonify({'message': 'User verified successfully.'}), 200
    return jsonify({'message': 'Verification failed.'}), 400

@api.route('/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()
    if user and user.check_password(data['password']):
        if not user.is_verified:
            return jsonify({'message': 'Please verify your email first.'}), 401
        access_token, refresh_token = generate_tokens(user.id)
        return jsonify({'token': access_token, 'refresh_token': refresh_token}), 200
    return jsonify({'message': 'Invalid credentials.'}), 401

@api.route('/refresh', methods=['POST'])
def refresh():
    if not request.is_json:
        return jsonify({'message': 'Missing JSON in request'}), 400
    refresh_token = request.json.get('refresh_token')
    if not refresh_token:
        return jsonify({'message': 'Refresh token is required'}), 400
    user_id = verify_token(refresh_token)
    if user_id:
        access_token, new_refresh_token = generate_tokens(user_id)
        return jsonify({'access_token': access_token, 'refresh_token': new_refresh_token}), 200
    return jsonify({'message': 'Invalid refresh token.'}), 401

@api.route('/generate_key', methods=['POST'])
@require_auth
@limiter.limit("3 per day")
def generate_api_key_route(user_id):
    try:
        new_key = generate_api_key()
        api_key = APIKey(key=new_key, user_id=user_id)
        db.session.add(api_key)
        db.session.commit()
        return jsonify({"api_key": new_key, "message": "Store this API key safely. It won't be shown again."}), 201
    except Exception as e:
        current_app.logger.error(f"Error generating API key: {str(e)}")
        return jsonify({"error": "An error occurred while generating the API key"}), 500

def retry_on_db_lock(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        max_retries = 3
        retry_delay = 1  # seconds
        for attempt in range(max_retries):
            try:
                return func(*args, **kwargs)
            except OperationalError as e:
                if "database is locked" in str(e) and attempt < max_retries - 1:
                    time.sleep(retry_delay)
                    continue
                raise
    return wrapper

from sqlalchemy.orm import Session

@api.route('/gather', methods=['POST'])
@require_auth
@retry_on_db_lock
@limiter.limit("5 per hour")
def api_gather_data(user_id):
    try:
        github_data = gather_data_from_github(Config.GITHUB_API_URL)
        stackoverflow_data = gather_data_from_stackoverflow(Config.STACKOVERFLOW_API_URL)
        
        combined_data = github_data + stackoverflow_data
        cleaned_data = clean_data(combined_data)
        
        new_snippetList = []
        with Session(db.engine) as session:
            for item in cleaned_data:
                existing_snippet = session.query(CodeSnippet).filter_by(url=item['url']).first()
                if not existing_snippet:
                    is_repo = 'github.com' in item.get('url', '')
                    snippet = CodeSnippet(
                        user_id=user_id,
                        url=item.get('url', ''),
                        name_or_title=item.get('name_or_title', 'Untitled'),
                        language=item.get('language', 'Unknown'),
                        code=item['url'] if is_repo else item.get('code', ''),
                        stars=item.get('stars', 0),
                        source=item.get('source', 'Unknown'),
                        is_user_submitted=False,
                        has_documentation=False,
                        is_repo=is_repo
                    )
                    new_snippetList.append(snippet)
            
            if new_snippetList:
                session.bulk_save_objects(new_snippetList)
                session.commit()
        
        current_app.logger.info(f"Successfully gathered and stored {len(new_snippetList)} new code snippets for user {user_id}")
        return jsonify({"message": f"Successfully gathered {len(new_snippetList)} new items", "count": len(new_snippetList)}), 200
    except Exception as e:
        current_app.logger.error(f"Error in api_gather_data: {str(e)}")
        return jsonify({"error": "An error occurred while gathering data"}), 500    
    
@api.route('/data', methods=['GET'])
@require_auth
def api_get_data(user_id):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        snippets = CodeSnippet.query.filter_by(user_id=user_id, is_user_submitted=False).paginate(page=page, per_page=per_page, error_out=False)
        
        snippet_data = [{
            **snippet.to_dict(),
            'has_documentation': snippet.has_documentation
        } for snippet in snippets.items]
        
        current_app.logger.info(f"Retrieved {snippets.total} gathered code snippets for user {user_id}")
        
        return jsonify({
            'snippets': {
                'items': snippet_data,
                'total': snippets.total,
                'pages': snippets.pages,
                'page': page
            }
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error in api_get_data: {str(e)}")
        return jsonify({"error": "An error occurred while retrieving data"}), 500

@api.route('/documentation', methods=['GET'])
@require_api_key
@limiter.limit("20 per hour")
def api_generate_docs():
    try:
        limit = request.args.get('limit', default=5, type=int)
        snippetList = CodeSnippet.query.filter(CodeSnippet.documentation.is_(None)).limit(limit).all()
        
        task_ids = []
        for snippet in snippetList:
            task = generate_documentation_task.delay(snippet.id)
            task_ids.append(task.id)
        
        current_app.logger.info(f"Started documentation generation for {len(snippetList)} code snippetList")
        return jsonify({
            "message": f"Documentation generation started for {len(snippetList)} snippetList",
            "task_ids": task_ids
        }), 202
    except Exception as e:
        current_app.logger.error(f"Error in api_generate_docs: {str(e)}")
        return jsonify({"error": "An error occurred while starting documentation generation"}), 500

def require_auth(view_function):
    @wraps(view_function)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'message': 'Authorization header is missing.'}), 401
        
        try:
            token_type, token = auth_header.split()
            if token_type.lower() != 'bearer':
                return jsonify({'message': 'Invalid token type.'}), 401
        except ValueError:
            return jsonify({'message': 'Invalid Authorization header format.'}), 401
        
        user_id = verify_token(token)
        if not user_id:
            return jsonify({'message': 'Invalid or expired token.'}), 401
        
        return view_function(user_id, *args, **kwargs)
    return decorated_function
@api.route('/search', methods=['GET'])
@require_auth
@limiter.limit("30 per minute")
def api_search(user_id):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        query = request.args.get('q', '')
        source = request.args.get('source', '')
        language = request.args.get('language', '')
        min_stars = request.args.get('min_stars', type=int)
        
        snippetList = CodeSnippet.query.filter_by(user_id=user_id).filter(CodeSnippet.name_or_title.ilike(f'%{query}%'))
        if source:
            snippetList = snippetList.filter_by(source=source)
        if language:
            snippetList = snippetList.filter_by(language=language)
        if min_stars:
            snippetList = snippetList.filter(CodeSnippet.stars >= min_stars)
        
        paginated_snippetList = snippetList.paginate(page=page, per_page=per_page, error_out=False)
        return jsonify({
            'items': [snippet.to_dict() for snippet in paginated_snippetList.items],
            'total': paginated_snippetList.total,
            'pages': paginated_snippetList.pages,
            'page': page
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error in api_search: {str(e)}")
        return jsonify({"error": "An error occurred while searching data"}), 500

@api.route('/submit', methods=['POST'])
@require_auth
@limiter.limit("10 per minute")
def submit_code(user_id):
    try:
        data = request.json
        code = data.get('code')
        repo_url = data.get('repoUrl')
        project_name = data.get('projectName')
        
        if not project_name:
            return jsonify({'message': 'Project name is required.'}), 400

        if code:
            documentation = generate_documentation({'code': code})
            snippet_content = code
            is_repo = False
        elif repo_url:
            repo_content = fetch_repository_content(repo_url)
            documentation = generate_documentation({'repo_content': repo_content, 'repo_url': repo_url})
            snippet_content = repo_url
            is_repo = True
        else:
            return jsonify({'message': 'No code or repository URL provided.'}), 400
        
        project = Project.query.filter_by(name=project_name, user_id=user_id).first()
        if not project:
            project = Project(name=project_name, user_id=user_id)
            db.session.add(project)
            db.session.flush()
        
        snippet = CodeSnippet(
            user_id=user_id,
            project_id=project.id,
            code=snippet_content,
            is_repo=is_repo,
            name_or_title=project_name,
            is_user_submitted=True,
            has_documentation=True
        )
        db.session.add(snippet)
        db.session.flush()
        
        doc = Documentation(content=documentation, user_id=user_id, project_id=project.id, snippet_id=snippet.id)
        db.session.add(doc)
        db.session.commit()
        
        return jsonify({'documentation_id': doc.id, 'documentation': documentation}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error in submit_code: {str(e)}")
        return jsonify({"error": "An error occurred while processing the submission"}), 500

@api.route('/submit-correction', methods=['POST'])
@require_auth
@limiter.limit("20 per hour")
def submit_correction(user_id):
    try:
        data = request.json
        documentation_id = data.get('documentation_id')
        correction_content = data.get('correction')
        
        documentation = Documentation.query.get_or_404(documentation_id)
        
        correction = Correction(content=correction_content, documentation_id=documentation_id, user_id=user_id)
        db.session.add(correction)
        db.session.commit()
        
        return jsonify({'message': 'Correction submitted successfully.', 'correction_id': correction.id}), 200
    except Exception as e:
        current_app.logger.error(f"Error in submit_correction: {str(e)}")
        return jsonify({"error": "An error occurred while submitting the correction"}), 500


@api.route('/', methods=['GET'])
def get_data():
    data = {
        "message": "Welcome to the CodeBase API",
        "version": "1.0",
        "endpoints": [
            {"path": "/signup", "method": "POST", "description": "Create a new user account"},
            {"path": "/login", "method": "POST", "description": "Authenticate and receive access token"},
            {"path": "/refresh", "method": "POST", "description": "Refresh access token"},
            {"path": "/generate_key", "method": "POST", "description": "Generate a new API key"},
            {"path": "/gather", "method": "POST", "description": "Gather code snippets from various sources"},
            {"path": "/data", "method": "GET", "description": "Retrieve user's code snippets"},
            {"path": "/documentation", "method": "GET", "description": "Generate documentation for code snippets"},
            {"path": "/documentation/<id>", "method": "GET", "description": "Retrieve documentation for a specific snippet"},
            {"path": "/search", "method": "GET", "description": "Search for code snippets"},
            {"path": "/submit-code", "method": "POST", "description": "Submit code or repository for documentation"},
            {"path": "/submit-correction", "method": "POST", "description": "Submit a correction for existing documentation"}
        ]
    }
    return jsonify(data), 200



@api.route('/documentation/<int:id>', methods=['GET'])
@require_auth
def get_documentation(user_id, id):
    try:
        snippet = CodeSnippet.query.get_or_404(id)
        if snippet.user_id != user_id:
            return jsonify({"error": "Unauthorized access"}), 403
        
        documentation = Documentation.query.filter_by(snippet_id=id).first()
        if documentation:
            return jsonify({"documentation": documentation.content}), 200
        else:
            return jsonify({"error": "Documentation not found"}), 404
    except Exception as e:
        current_app.logger.error(f"Error fetching documentation: {str(e)}")
        return jsonify({"error": "An error occurred while fetching documentation"}), 500

# Update the generate_documentation_for_snippet function


@api.route('/documentation/generate/<int:id>', methods=['POST'])
@require_auth
def generate_documentation_for_snippet(user_id, id):
    try:
        snippet = CodeSnippet.query.get_or_404(id)
        if snippet.user_id != user_id:
            return jsonify({"error": "Unauthorized access"}), 403
        
        if snippet.is_repo:
            if not snippet.code:
                return jsonify({"error": "Repository URL is missing"}), 400
            repo_content = fetch_repository_content(snippet.code)
            if 'error' in repo_content:
                return jsonify({"error": repo_content['error']}), 500
            documentation_content = generate_documentation({'repo_url': snippet.code, 'repo_content': repo_content})
        else:
            documentation_content = generate_documentation({
                'code': snippet.code,
                'name_or_title': snippet.name_or_title,
                'language': snippet.language
            })
        
        documentation = Documentation.query.filter_by(snippet_id=id).first()
        if documentation:
            documentation.content = documentation_content
        else:
            documentation = Documentation(
                content=documentation_content, 
                user_id=user_id, 
                project_id=snippet.project_id, 
                snippet_id=snippet.id
            )
            db.session.add(documentation)
        
        snippet.has_documentation = True
        db.session.commit()
        
        return jsonify({"message": "Documentation generated successfully", "documentation": documentation_content}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error generating documentation: {str(e)}", exc_info=True)
        return jsonify({"error": f"An error occurred while generating documentation: {str(e)}"}), 500


@api.route('/user-snippets', methods=['GET'])
@require_auth
def api_get_user_snippets(user_id):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        snippets = CodeSnippet.query.filter_by(user_id=user_id, is_user_submitted=True).paginate(page=page, per_page=per_page, error_out=False)
        
        snippet_data = [{
            **snippet.to_dict(),
            'has_documentation': snippet.has_documentation
        } for snippet in snippets.items]
        
        current_app.logger.info(f"Retrieved {snippets.total} user-submitted code snippets for user {user_id}")
        
        return jsonify({
            'snippets': {
                'items': snippet_data,
                'total': snippets.total,
                'pages': snippets.pages,
                'page': page
            }
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error in api_get_user_snippets: {str(e)}")
        return jsonify({"error": "An error occurred while retrieving user snippets"}), 500
    
@api.route('/dashboard', methods=['GET'])
@require_auth
def get_dashboard_data(user_id):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)

        # Get user-submitted snippets
        user_snippets = CodeSnippet.query.filter_by(user_id=user_id, is_user_submitted=True).paginate(page=page, per_page=per_page, error_out=False)

        # Get counts
        total_snippets = CodeSnippet.query.filter_by(user_id=user_id, is_user_submitted=True).count()
        documented_snippets = CodeSnippet.query.filter_by(user_id=user_id, is_user_submitted=True, has_documentation=True).count()

        snippet_data = [{
            **snippet.to_dict(),
            'has_documentation': snippet.has_documentation
        } for snippet in user_snippets.items]

        return jsonify({
            'total_snippets': total_snippets,
            'documented_snippets': documented_snippets,
            'snippets': {
                'items': snippet_data,
                'total': user_snippets.total,
                'pages': user_snippets.pages,
                'page': page
            }
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error in get_dashboard_data: {str(e)}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred while retrieving dashboard data. Please try again later."}), 500