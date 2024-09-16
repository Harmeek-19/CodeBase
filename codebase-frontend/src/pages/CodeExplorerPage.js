import React, { useState, useEffect, useCallback } from 'react';
import { Search, Book, Code, ChevronLeft, ChevronRight } from 'lucide-react';
import { api_get_data, getDocumentation, generateDocs } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function CodeExplorerPage() {
  const [snippets, setSnippets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [language, setLanguage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSnippet, setSelectedSnippet] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const snippetsPerPage = 10;

  const handleApiError = useCallback((error) => {
    console.error('API Error:', error);
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      navigate('/login');
    } else {
      setError('An error occurred. Please try again later.');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchSnippets = async () => {
      try {
        setLoading(true);
        const response = await api_get_data(currentPage, snippetsPerPage);
        setSnippets(response.data.snippets.items || []);
        setTotalPages(Math.ceil(response.data.snippets.total / snippetsPerPage));
      } catch (error) {
        handleApiError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchSnippets();
  }, [currentPage, handleApiError]);

  const handleSnippetClick = async (snippetId) => {
    try {
      const snippet = snippets.find(s => s.id === snippetId);
      if (snippet.has_documentation) {
        const response = await getDocumentation(snippetId);
        setSelectedSnippet({
          ...snippet,
          documentation: response.data.documentation
        });
      } else {
        setSelectedSnippet(snippet);
      }
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleGenerateDocumentation = async (snippetId) => {
    try {
      const response = await generateDocs(snippetId);
      const updatedSnippet = {
        ...snippets.find(s => s.id === snippetId),
        has_documentation: true,
        documentation: response.data.documentation
      };
      setSelectedSnippet(updatedSnippet);
      setSnippets(snippets.map(s => s.id === snippetId ? updatedSnippet : s));
    } catch (error) {
      handleApiError(error);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const filteredSnippets = snippets.filter(
    (snippet) =>
      (snippet.name_or_title || '').toLowerCase().includes(searchTerm.toLowerCase()) &&
      (language === '' || snippet.language === language)
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="flex-grow bg-gray-100">
      <div className="min-h-screen bg-gray-100">
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-center mb-8">Code Explorer</h1>
          <div className="mb-6 flex space-x-4">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search snippets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 rounded-full border-2 border-gray-300 focus:outline-none focus:border-blue-500 text-lg"
              />
              <button className="absolute right-2 top-2 p-2 bg-blue-500 text-white rounded-full">
                <Search className="w-5 h-5" />
              </button>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-lg"
            >
              <option value="">All Languages</option>
              <option value="JavaScript">JavaScript</option>
              <option value="Python">Python</option>
              {/* Add more language options as needed */}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Snippets</h2>
              <ul className="divide-y divide-gray-200">
                {filteredSnippets.map((snippet) => (
                  <li key={snippet.id} className="py-4 cursor-pointer" onClick={() => handleSnippetClick(snippet.id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Code className="h-6 w-6 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {snippet.name_or_title || 'Untitled Snippet'}
                          </p>
                          <p className="text-xs text-gray-500">Language: {snippet.language || 'Unknown'}</p>
                          <p className="text-yellow-500">★ {snippet.stars || 0}</p>
                        </div>
                      </div>
                      <span className={snippet.has_documentation ? "text-green-500" : "text-red-500"}>
                        {snippet.has_documentation ? "Documented" : "Not Documented"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
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
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Documentation</h2>
              {selectedSnippet ? (
                <div>
                  <h3 className="text-xl font-semibold mb-2">{selectedSnippet.name_or_title || 'Untitled Snippet'}</h3>
                  <p className="text-sm text-gray-600 mb-2">Language: {selectedSnippet.language || 'Unknown'}</p>
                  <p className="text-yellow-500 mb-4">★ {selectedSnippet.stars || 0}</p>
                  {selectedSnippet.documentation ? (
                    <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                      <code>{selectedSnippet.documentation || 'No documentation available.'}</code>
                    </pre>
                  ) : (
                    <div>
                      <p className="text-gray-500 mb-4">No documentation available.</p>
                      <button
                        onClick={() => handleGenerateDocumentation(selectedSnippet.id)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                      >
                        Generate Documentation
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <Book className="w-8 h-8 mr-2" />
                  <p>Select a snippet to view its documentation</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
