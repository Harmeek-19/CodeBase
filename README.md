# CodeBase

CodeBase is a comprehensive web application designed to help developers manage, document, and explore code snippets and repositories. It provides an intuitive interface for submitting code or repository URLs, generating documentation using AI, and exploring a vast collection of code snippets.

## Features

- User authentication and authorization
- Submit code snippets or repository URLs
- AI-powered documentation generation
- Code snippet exploration and search
- Dashboard for managing user-submitted snippets
- API key generation for CI/CD integration
- Pagination for efficient data loading
- Responsive design for various screen sizes

## Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Axios for API requests
- React Router for navigation

### Backend
- Flask (Python)
- SQLAlchemy for database ORM
- Flask-RESTful for API development
- Celery for asynchronous tasks
- Redis as message broker
- OpenAI GPT for documentation generation

## Prerequisites

- Node.js (v14+)
- Python (v3.7+)
- Redis
- PostgreSQL

## Setup Instructions

### Backend Setup

1. Clone the repository:
   ```
   git clone https://github.com/your-username/codebase.git
   cd codebase/backend
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   Create a `.env` file in the backend directory and add the following:
   ```
   FLASK_APP=app
   FLASK_ENV=development
   DATABASE_URL=postgresql://username:password@localhost/codebase
   SECRET_KEY=your_secret_key
   OPENAI_API_KEY=your_openai_api_key
   ```

5. Initialize the database:
   ```
   flask db upgrade
   ```

6. Start the Flask development server:
   ```
   flask run
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd ../frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the frontend directory and add:
   ```
   REACT_APP_API_URL=http://localhost:5000/api/v1
   ```

4. Start the development server:
   ```
   npm start
   ```

## Usage

1. Open your browser and go to `http://localhost:3000`
2. Sign up for a new account or log in
3. Use the "Submit Code" page to submit code snippets or repository URLs
4. Explore submitted snippets and their documentation in the "Code Explorer" page
5. Manage your snippets and generate API keys from the Dashboard

## API Endpoints

- POST `/api/v1/signup`: Create a new user account
- POST `/api/v1/login`: Authenticate and receive access token
- POST `/api/v1/refresh`: Refresh access token
- POST `/api/v1/generate_key`: Generate a new API key
- POST `/api/v1/gather`: Gather code snippets from various sources
- GET `/api/v1/data`: Retrieve user's code snippets
- GET `/api/v1/documentation`: Generate documentation for code snippets
- GET `/api/v1/documentation/<id>`: Retrieve documentation for a specific snippet
- GET `/api/v1/search`: Search for code snippets
- POST `/api/v1/submit`: Submit code or repository for documentation
- POST `/api/v1/submit-correction`: Submit a correction for existing documentation

For detailed API documentation, refer to the [API Documentation](./API_DOCUMENTATION.md) file.

## Contributing

We welcome contributions to CodeBase! Please follow these steps to contribute:

1. Fork the repository
2. Create a new branch: `git checkout -b feature-branch-name`
3. Make your changes and commit them: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-branch-name`
5. Submit a pull request

Please make sure to update tests as appropriate and adhere to the [Code of Conduct](./CODE_OF_CONDUCT.md).

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Acknowledgments

- OpenAI for providing the GPT model used in documentation generation
- All the open-source libraries and frameworks used in this project

## Contact

For any queries or support, please contact us at support@codebase-project.com or open an issue on GitHub.
