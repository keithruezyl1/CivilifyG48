import React from 'react';
import NetworkDiagnostic from '../components/NetworkDiagnostic';
import { Link } from 'react-router-dom';

const DiagnosticsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">System Diagnostics</h1>
        <Link to="/" className="text-blue-600 hover:text-blue-800">
          &larr; Back to Home
        </Link>
      </div>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-800">
              This page helps diagnose connectivity issues between the frontend and backend.
              If you're experiencing problems with authentication or API calls, use the tools below to identify the cause.
            </p>
          </div>
        </div>
      </div>
      
      <NetworkDiagnostic />
      
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Common Issues and Solutions</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-700">Backend Not Reachable</h3>
            <p className="text-sm text-gray-600 mt-1">
              Make sure your backend server is running at the configured URL ({import.meta.env.VITE_API_URL || 'http://localhost:8081'}).
              Check terminal for any error messages from the backend server.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700">CORS Errors</h3>
            <p className="text-sm text-gray-600 mt-1">
              Ensure the backend CORS configuration includes your frontend origin. The current frontend origin is: {window.location.origin}
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700">Authentication Issues</h3>
            <p className="text-sm text-gray-600 mt-1">
              If your JWT token is invalid or expired, try logging out and back in. Check that your .env file has the proper JWT configuration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticsPage;
