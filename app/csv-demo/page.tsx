'use client';

import React, { useState } from 'react';
import CSVLoader, { ParsedCSVData } from '../components/loaders/CSVLoader';
import { motion } from 'framer-motion';
import { Database, BarChart3, FileSpreadsheet } from 'lucide-react';

export default function CSVDemoPage() {
  const [loadedData, setLoadedData] = useState<ParsedCSVData | null>(null);
  const [errorLog, setErrorLog] = useState<string[]>([]);

  const handleDataLoaded = (data: ParsedCSVData) => {
    console.log('CSV Data Loaded:', {
      fileName: data.fileName,
      headers: data.headers,
      rowCount: data.rowCount,
      sampleRow: data.rows[0]
    });
    setLoadedData(data);
    setErrorLog([]);
  };

  const handleError = (error: string) => {
    console.error('CSV Loading Error:', error);
    setErrorLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${error}`]);
  };

  const handleReset = () => {
    setLoadedData(null);
    setErrorLog([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            CSV Data Loader
          </h1>
          <p className="text-lg text-gray-600">
            Professional CSV file upload and preview component with smooth animations
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <CSVLoader
            onDataLoaded={handleDataLoaded}
            onError={handleError}
            maxFileSize={5 * 1024 * 1024} // 5MB limit for demo
          />
        </motion.div>

        {loadedData && (
          <motion.div
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-md p-6 text-center"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Database className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800">{loadedData.rowCount}</p>
              <p className="text-sm text-gray-600">Total Rows</p>
            </motion.div>

            <motion.div
              className="bg-white rounded-lg shadow-md p-6 text-center"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <BarChart3 className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800">{loadedData.headers.length}</p>
              <p className="text-sm text-gray-600">Columns</p>
            </motion.div>

            <motion.div
              className="bg-white rounded-lg shadow-md p-6 text-center"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <FileSpreadsheet className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-lg font-bold text-gray-800 truncate">{loadedData.fileName}</p>
              <p className="text-sm text-gray-600">File Name</p>
            </motion.div>
          </motion.div>
        )}

        {errorLog.length > 0 && (
          <motion.div
            className="mt-8 max-w-4xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-red-800 font-semibold mb-2">Error Log</h3>
              <div className="space-y-1">
                {errorLog.map((error, index) => (
                  <p key={index} className="text-sm text-red-600">{error}</p>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {loadedData && (
          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Reset Demo
            </button>
          </motion.div>
        )}

        <motion.div
          className="mt-12 max-w-4xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="bg-gray-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Features</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Drag-and-drop file upload with visual feedback
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Smooth Framer Motion animations throughout
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                CSV parsing with PapaParse library
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                File size validation and error handling
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Data preview with staggered row animations
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Responsive design for all screen sizes
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                TypeScript support with proper type definitions
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Professional UI with loading states
              </li>
            </ul>
          </div>
        </motion.div>

        <motion.div
          className="mt-8 max-w-4xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Usage Example</h3>
            <pre className="bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`import CSVLoader from './components/CSVLoader';

const MyApp = () => {
  const handleDataLoaded = (data) => {
    console.log('Headers:', data.headers);
    console.log('Rows:', data.rows.length);
    // Process your CSV data here
  };

  const handleError = (error) => {
    console.error('Error:', error);
  };

  return (
    <CSVLoader 
      onDataLoaded={handleDataLoaded}
      onError={handleError}
      maxFileSize={10 * 1024 * 1024} // 10MB
    />
  );
};`}
            </pre>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
