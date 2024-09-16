import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex-grow h-screen bg-gray-100">
    <div className="h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-center mb-8">Welcome to CodeBase</h1>
        <p className="text-xl text-center mb-8">
          Explore, document, and manage your code snippetList with ease. CodeBase is your all-in-one solution for code management and documentation.
        </p>
        <div className="flex justify-center">
          <input
            type="text"
            placeholder="Search for code snippetList..."
            className="px-4 py-2 w-full max-w-md rounded-l-lg border-2 border-blue-500 focus:outline-none focus:border-blue-600"
          />
          <button className="bg-blue-500 text-white px-6 py-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
            Search
          </button>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            title="Code Explorer"
            description="Browse and search through a vast collection of code snippetList."
            link="/code-explorer"
          />
          <FeatureCard
            title="Documentation"
            description="Generate and manage documentation for your code snippetList."
            link="/documentation"
          />
          <FeatureCard
            title="API Explorer"
            description="Test and interact with our API endpoints."
            link="/api-explorer"
          />
        </div>
      </main>
      <footer className="mt-12 bg-gray-200 py-4">
        <p className="text-center text-gray-600">© 2023 CodeBase. All rights reserved.</p>
      </footer>
    </div>
    </div>
  );
}

function FeatureCard({ title, description, link }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      <p className="text-gray-600 mb-4">{description}</p>
      <Link to={link} className="text-blue-500 hover:text-blue-600">
        Learn more &rarr;
      </Link>
    </div>
  );
}