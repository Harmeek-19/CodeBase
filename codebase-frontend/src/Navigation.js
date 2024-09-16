import React from 'react';
import { Link } from 'react-router-dom';
import { Code,  User, LogIn, Search, Download, Edit } from 'lucide-react';

export default function Navigation({ isAuthenticated, onLogout }) {
  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-white">CodeBase</span>
            </Link>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <NavLink href="/code-explorer" icon={<Code className="w-5 h-5 mr-1" />} text="Code Explorer" />
            
            <NavLink href="/search" icon={<Search className="w-5 h-5 mr-1" />} text="Search" />
            {isAuthenticated && (
              <>
                <NavLink href="/gather-snippets" icon={<Download className="w-5 h-5 mr-1" />} text="Gather Snippets" />
                <NavLink href="/submit-code" icon={<Edit className="w-5 h-5 mr-1" />} text="Submit Code" />
                <NavLink href="/dashboard" icon={<User className="w-5 h-5 mr-1" />} text="Dashboard" />
                <button onClick={onLogout} className="text-gray-100 hover:text-white hover:bg-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Logout</button>
              </>
            )}
            {!isAuthenticated && <NavLink href="/login" icon={<LogIn className="w-5 h-5 mr-1" />} text="Login" />}
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, icon, text }) {
  return (
    <Link to={href} className="text-gray-100 hover:text-white hover:bg-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center mx-1 transition duration-150 ease-in-out">
      {icon}
      {text}
    </Link>
  );
}