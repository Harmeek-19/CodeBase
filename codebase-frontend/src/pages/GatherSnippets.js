import React, { useState } from 'react';
import { api_gather_data, api_get_data, generateDocs } from '../services/api';
import { Code, Download, Book, Info } from 'lucide-react';

export default function GatherSnippets() {
  const [gathering, setGathering] = useState(false);
  const [snippets, setSnippets] = useState([]);
  const [error, setError] = useState(null);

  const handleGatherData = async () => {
    try {
      setGathering(true);
      const gatherResponse = await api_gather_data();
      console.log('Gather response:', gatherResponse.data);
      const dataResponse = await api_get_data();
      setSnippets(dataResponse.data.snippets.items || []);
    } catch (err) {
      console.error('Error gathering data:', err);
      setError('Failed to gather data. Please try again.');
    } finally {
      setGathering(false);
    }
  };

  const handleGenerateDocs = async (snippetId) => {
    try {
      await generateDocs(snippetId);
      // Refresh the snippets list to show updated documentation status
      const dataResponse = await api_get_data();
      setSnippets(dataResponse.data.snippets.items || []);
    } catch (err) {
      console.error('Error generating documentation:', err);
      setError('Failed to generate documentation. Please try again.');
    }
  };

  return (
    <div className="flex-grow bg-gray-100">
      <div className="min-h-screen bg-gray-100">
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-center mb-8">Gather Snippets</h1>
          
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-8" role="alert">
            <div className="flex">
              <div className="py-1"><Info className="h-6 w-6 text-blue-500 mr-4" /></div>
              <div>
                <p className="font-bold">What does this page do?</p>
                <p>This page allows you to gather code snippets from various sources like GitHub, GitLab, and Stack Overflow. By clicking the &quot;Gather Snippets&quot; button, you can fetch and store new code snippets in our database. These snippets can then be used to generate documentation, helping you understand and learn from a wide variety of code examples.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <button
              onClick={handleGatherData}
              disabled={gathering}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <Download className="w-5 h-5 mr-2" />
              {gathering ? 'Gathering...' : 'Gather Snippets'}
            </button>
            {error && <p className="text-red-500 mt-2">{error}</p>}
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Gathered Snippets</h2>
            {snippets.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {snippets.map((snippet) => (
                  <li key={snippet.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Code className="h-6 w-6 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {snippet.title || snippet.name_or_title || 'Untitled Snippet'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Language: {snippet.language || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleGenerateDocs(snippet.id)}
                        className={`px-3 py-1 rounded-lg flex items-center ${
                          snippet.documentation ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
                        } text-white`}
                        disabled={snippet.documentation}
                      >
                        <Book className="w-4 h-4 mr-1" />
                        {snippet.documentation ? 'Documentation Generated' : 'Generate Docs'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No snippets available. Click &quot;Gather Snippets&quot; to fetch data.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}