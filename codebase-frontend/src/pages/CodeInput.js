import React, { useState } from 'react';
import { submitCode } from '../services/api';

export default function SubmitCode() {
  const [submitType, setSubmitType] = useState('code');
  const [code, setCode] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [documentation, setDocumentation] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setDocumentation('');

    if (!projectName) {
      setError('Please provide a project name.');
      return;
    }

    if (submitType === 'code' && !code) {
      setError('Please provide code.');
      return;
    }

    if (submitType === 'repo' && !repoUrl) {
      setError('Please provide a repository URL.');
      return;
    }

    try {
      const response = await submitCode({
        code: submitType === 'code' ? code : undefined,
        repoUrl: submitType === 'repo' ? repoUrl : undefined,
        projectName
      });
      setSuccess('Submission successful!');
      setDocumentation(response.data.documentation);
      setCode('');
      setRepoUrl('');
      setProjectName('');
    } catch (err) {
      setError('Failed to submit. Please try again.');
    }
  };

  return (
    <div className="flex-grow bg-gray-100">
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Submit Code</h1>
        <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow-md rounded-lg p-6">
          <div>
            <label htmlFor="submitType" className="block text-sm font-medium text-gray-700 mb-1">
              Submission Type
            </label>
            <select
              id="submitType"
              value={submitType}
              onChange={(e) => setSubmitType(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="code">Code Snippet</option>
              <option value="repo">Repository URL</option>
            </select>
          </div>

          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">
              Project Name
            </label>
            <input
              type="text"
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter project name"
            />
          </div>

          {submitType === 'code' ? (
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                Code
              </label>
              <textarea
                id="code"
                rows="8"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Paste your code here"
              ></textarea>
            </div>
          ) : (
            <div>
              <label htmlFor="repoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Repository URL
              </label>
              <input
                type="text"
                id="repoUrl"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter repository URL"
              />
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}
          
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Submit
          </button>
        </form>
        
        {documentation && (
          <div className="mt-8 bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Generated Documentation</h2>
            <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap overflow-x-auto text-sm">
              {documentation}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}