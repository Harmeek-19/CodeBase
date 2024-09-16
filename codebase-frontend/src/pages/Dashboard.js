import React, { useState, useEffect } from 'react';
import { Code, Loader, Book, ChevronLeft, ChevronRight, Key } from 'lucide-react';
import { getDashboardData, generateDocs, getDocumentation, generateApiKey } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [snippets, setSnippets] = useState([]);
  const [totalSnippets, setTotalSnippets] = useState(0);
  const [documentedSnippets, setDocumentedSnippets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSnippet, setSelectedSnippet] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDashboardData(currentPage);
        setSnippets(data.snippets.items);
        setTotalSnippets(data.total_snippets);
        setDocumentedSnippets(data.documented_snippets);
        setTotalPages(data.snippets.pages);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        if (err.response && err.response.status === 401) {
          navigate('/login');
        } else {
          setError('Failed to fetch dashboard data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate, currentPage]);

  const handleGenerateDocumentation = async (snippetId) => {
    try {
      setLoading(true);
      await generateDocs(snippetId);
      const data = await getDashboardData(currentPage);
      setSnippets(data.snippets.items);
      setDocumentedSnippets(data.documented_snippets);
    } catch (error) {
      console.error('Error generating documentation:', error);
      setError('Failed to generate documentation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocumentation = async (snippetId) => {
    try {
      setLoading(true);
      const response = await getDocumentation(snippetId);
      setSelectedSnippet({
        ...snippets.find(s => s.id === snippetId),
        documentation: response.data.documentation
      });
    } catch (error) {
      console.error('Error fetching documentation:', error);
      setError('Failed to fetch documentation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleGenerateApiKey = async () => {
    try {
      setLoading(true);
      const response = await generateApiKey();
      setApiKey(response.data.api_key);
    } catch (error) {
      console.error('Error generating API key:', error);
      setError('Failed to generate API key. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="animate-spin h-10 w-10 text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-center">
          <p className="text-xl font-bold mb-2">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-center mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Total Snippets</h2>
            <p className="text-3xl font-bold">{totalSnippets}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Documented Snippets</h2>
            <p className="text-3xl font-bold">{documentedSnippets}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Snippets</h2>
          {snippets.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {snippets.map((snippet) => (
                <li key={snippet.id} className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Code className="h-6 w-6 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {snippet.name_or_title || 'Untitled Snippet'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {snippet.is_repo ? 'Repository' : 'Code Snippet'}
                        </p>
                      </div>
                    </div>
                    {snippet.has_documentation ? (
                      <button
                        onClick={() => handleViewDocumentation(snippet.id)}
                        className="bg-blue-500 text-white px-3 py-1 rounded-lg flex items-center"
                      >
                        <Book className="w-4 h-4 mr-1" />
                        View Documentation
                      </button>
                    ) : (
                      <button
                        onClick={() => handleGenerateDocumentation(snippet.id)}
                        className="bg-green-500 text-white px-3 py-1 rounded-lg flex items-center"
                      >
                        <Book className="w-4 h-4 mr-1" />
                        Generate Documentation
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No snippets available. Submit some code to get started!</p>
          )}
          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ChevronLeft className="mr-2 h-5 w-5" />
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Next
              <ChevronRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">API Key</h2>
          {apiKey ? (
            <div>
              <p className="mb-2">Your API Key:</p>
              <code className="bg-gray-100 p-2 rounded block mb-2">{apiKey}</code>
              <p className="text-sm text-gray-600">Keep this key secure. It can be used in your CI/CD pipeline.</p>
            </div>
          ) : (
            <button
              onClick={handleGenerateApiKey}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm flex items-center hover:bg-indigo-700"
            >
              <Key className="w-4 h-4 mr-2" />
              Generate API Key
            </button>
          )}
        </div>

        {selectedSnippet && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Documentation</h2>
            <h3 className="text-xl font-semibold mb-2">{selectedSnippet.name_or_title || 'Untitled Snippet'}</h3>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
              <code>{selectedSnippet.documentation}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}