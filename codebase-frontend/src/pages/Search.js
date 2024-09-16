import React, { useState } from 'react';
import { SearchIcon } from '@heroicons/react/solid'; // Import the search icon
import { searchCodesnippetList } from '../services/api';

export default function CodeExplorer() {
  // Removed extra bracket
  const [searchTerm, setSearchTerm] = useState('');
  const [language, setLanguage] = useState('');
  const [source, setSource] = useState(''); // Defined source state
  const [minStars, setMinStars] = useState(0); // Defined minStars state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]); // Defined results state

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await searchCodesnippetList({ q: searchTerm, language, source, min_stars: minStars });
      setResults(response.data.items || []);
    } catch (err) {
      console.error('Error searching snippets:', err);
      setError('Failed to search snippets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow bg-gray-100">
      <div className="min-h-screen bg-gray-100">
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-center mb-8">Advanced Search</h1>
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label htmlFor="searchTerm" className="block text-xl font-medium text-gray-700 mb-2">
                  Search Term
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="searchTerm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 rounded-full border-2 border-gray-300 focus:outline-none focus:border-blue-500 text-lg"
                    placeholder="Enter keywords..."
                  />
                  <button type="submit" className="absolute right-2 top-2 p-2 bg-blue-500 text-white rounded-full">
                    <SearchIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="language" className="block text-xl font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-lg"
                  >
                    <option value="">All Languages</option>
                    <option value="JavaScript">JavaScript</option>
                    <option value="Python">Python</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="source" className="block text-xl font-medium text-gray-700 mb-2">
                    Source
                  </label>
                  <select
                    id="source"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-lg"
                  >
                    <option value="">All Sources</option>
                    <option value="GitHub">GitHub</option>
                    <option value="GitLab">GitLab</option>
                    <option value="Bitbucket">Bitbucket</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="minStars" className="block text-xl font-medium text-gray-700 mb-2">
                    Minimum Stars
                  </label>
                  <input
                    type="number"
                    id="minStars"
                    value={minStars}
                    onChange={(e) => setMinStars(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-lg"
                    placeholder="Enter minimum stars..."
                  />
                </div>
              </div>
            </form>
          </div>
          {loading && <p className="text-center">Searching...</p>}
          {error && <p className="text-center text-red-500">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((result) => (
              <div
                key={result.id}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <h2 className="text-2xl font-semibold mb-2">{result.title || result.name_or_title}</h2>
                <p className="text-lg text-gray-600 mb-2">Language: {result.language}</p>
                <p className="text-lg text-gray-600 mb-2">Source: {result.source}</p>
                <p className="text-lg text-yellow-500">★ {result.stars}</p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
