import json
from app import create_app, db
from app.models.code_snippet import CodeSnippet

def test_api_gather_data(client):
    response = client.post('/api/v1/gather', headers={'X-API-Key': 'test_api_key'})
    assert response.status_code == 200
    assert 'Successfully gathered' in json.loads(response.data)['message']

def test_api_get_documentation(client):
    app = create_app()
    with app.app_context():
        snippet = CodeSnippet(source='GitHub', name_or_title='Test Repo', url='https://github.com/test/repo')
        db.session.add(snippet)
        db.session.commit()
        
        response = client.get(f'/api/v1/documentation/{snippet.id}', headers={'X-API-Key': 'test_api_key'})
        assert response.status_code == 200
        assert 'documentation' in json.loads(response.data)

def test_api_search(client):
    response = client.get('/api/v1/search?q=test&source=GitHub', headers={'X-API-Key': 'test_api_key'})
    assert response.status_code == 200
    assert isinstance(json.loads(response.data), list)

def test_api_key_required(client):
    response = client.post('/api/v1/gather')
    assert response.status_code == 403
    assert 'Invalid or missing API Key' in json.loads(response.data)['error']

    response = client.post('/api/v1/gather', headers={'X-API-Key': 'wrong_key'})
    assert response.status_code == 403
    assert 'Invalid or missing API Key' in json.loads(response.data)['error']

    response = client.post('/api/v1/gather', headers={'X-API-Key': 'test_api_key'})
    assert response.status_code == 200