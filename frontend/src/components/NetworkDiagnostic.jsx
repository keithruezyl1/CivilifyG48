import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { checkBackendHealth, testCorsConfiguration } from '../utils/backendHealthCheck';

const NetworkDiagnostic = () => {
  const [results, setResults] = useState({
    status: 'idle',
    health: null,
    cors: null,
    debug: null,
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8081'
  });

  const [token, setToken] = useState(localStorage.getItem('authToken') || '');
  const [expandedSection, setExpandedSection] = useState(null);

  const runAllTests = async () => {
    setResults(prev => ({ ...prev, status: 'running' }));
    
    try {
      // Step 1: Check basic backend health
      const isHealthy = await checkBackendHealth();
      setResults(prev => ({ ...prev, health: { success: isHealthy } }));
      
      // Step 2: Test CORS configuration
      const corsResult = await testCorsConfiguration();
      setResults(prev => ({ ...prev, cors: corsResult }));
      
      // Step 3: Check debug endpoint for detailed info
      if (isHealthy) {
        try {
          const debugResponse = await axios.get(`${results.apiUrl}/api/debug/request-info`, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
              'X-Test-Header': 'diagnostic-tool'
            },
            timeout: 5000
          });
          setResults(prev => ({ ...prev, debug: { success: true, data: debugResponse.data } }));
        } catch (error) {
          setResults(prev => ({ 
            ...prev, 
            debug: { 
              success: false, 
              error: error.message,
              status: error.response?.status || 'unknown',
              data: error.response?.data || null
            } 
          }));
        }
      }
      
      // Step 4: Validate token if provided
      if (token && isHealthy) {
        try {
          const tokenResponse = await axios.get(
            `${results.apiUrl}/api/debug/validate-token?token=${encodeURIComponent(token)}`,
            { timeout: 5000 }
          );
          setResults(prev => ({ 
            ...prev, 
            token: { success: true, data: tokenResponse.data } 
          }));
        } catch (error) {
          setResults(prev => ({ 
            ...prev, 
            token: { 
              success: false, 
              error: error.message,
              data: error.response?.data || null
            } 
          }));
        }
      }
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setResults(prev => ({ ...prev, status: 'complete' }));
    }
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-4xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Network Diagnostic Tool</h2>
      <p className="text-gray-600 mb-6">Use this tool to diagnose connectivity issues between the frontend and backend.</p>
      
      {/* Configuration */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API URL</label>
            <input 
              type="text" 
              value={results.apiUrl} 
              onChange={(e) => setResults(prev => ({ ...prev, apiUrl: e.target.value }))} 
              className="w-full p-2 border rounded-md text-sm"
              placeholder="http://localhost:8081"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">JWT Token (Optional)</label>
            <input 
              type="text" 
              value={token} 
              onChange={(e) => setToken(e.target.value)} 
              className="w-full p-2 border rounded-md text-sm"
              placeholder="eyJhbGciOiJIUzI1NiJ9...."
            />
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="mb-6">
        <button 
          onClick={runAllTests} 
          disabled={results.status === 'running'}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md"
        >
          {results.status === 'running' ? 'Running Tests...' : 'Run Diagnostic Tests'}
        </button>
      </div>
      
      {/* Results */}
      {results.status !== 'idle' && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-100 p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">Diagnostic Results</h3>
          </div>
          
          {/* Health Check */}
          <div className="border-b">
            <div 
              className="p-4 cursor-pointer flex justify-between items-center hover:bg-gray-50"
              onClick={() => toggleSection('health')}
            >
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${results.health?.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-medium">Backend Health Check</span>
              </div>
              <span>{expandedSection === 'health' ? '−' : '+'}</span>
            </div>
            {expandedSection === 'health' && (
              <div className="p-4 bg-gray-50 border-t">
                <p className="text-sm">
                  {results.health?.success 
                    ? '✅ Backend server is reachable.'
                    : '❌ Backend server is not reachable. Please check if your backend is running and the API URL is correct.'}
                </p>
              </div>
            )}
          </div>
          
          {/* CORS Test */}
          <div className="border-b">
            <div 
              className="p-4 cursor-pointer flex justify-between items-center hover:bg-gray-50"
              onClick={() => toggleSection('cors')}
            >
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${results.cors?.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-medium">CORS Configuration</span>
              </div>
              <span>{expandedSection === 'cors' ? '−' : '+'}</span>
            </div>
            {expandedSection === 'cors' && (
              <div className="p-4 bg-gray-50 border-t">
                {results.cors?.success ? (
                  <p className="text-sm">✅ CORS is properly configured.</p>
                ) : (
                  <div>
                    <p className="text-sm mb-2">❌ CORS test failed. Error: {results.cors?.error}</p>
                    <p className="text-sm">Check that your backend CORS configuration includes your frontend origin.</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Debug Info */}
          <div className="border-b">
            <div 
              className="p-4 cursor-pointer flex justify-between items-center hover:bg-gray-50"
              onClick={() => toggleSection('debug')}
            >
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${results.debug?.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-medium">Request Debug Info</span>
              </div>
              <span>{expandedSection === 'debug' ? '−' : '+'}</span>
            </div>
            {expandedSection === 'debug' && (
              <div className="p-4 bg-gray-50 border-t overflow-auto">
                {results.debug?.success ? (
                  <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(results.debug.data, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm">❌ Could not retrieve debug information: {results.debug?.error}</p>
                )}
              </div>
            )}
          </div>
          
          {/* Token Validation */}
          {token && (
            <div className="border-b">
              <div 
                className="p-4 cursor-pointer flex justify-between items-center hover:bg-gray-50"
                onClick={() => toggleSection('token')}
              >
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${results.token?.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="font-medium">JWT Token Validation</span>
                </div>
                <span>{expandedSection === 'token' ? '−' : '+'}</span>
              </div>
              {expandedSection === 'token' && (
                <div className="p-4 bg-gray-50 border-t overflow-auto">
                  {results.token?.success ? (
                    <div>
                      <p className="text-sm mb-2">
                        Token is {results.token.data?.isValid ? 'valid' : 'invalid'}
                        {results.token.data?.isExpired && ' (expired)'}
                      </p>
                      <pre className="text-xs whitespace-pre-wrap">
                        {JSON.stringify(results.token.data, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-sm">❌ Could not validate token: {results.token?.error}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NetworkDiagnostic;
