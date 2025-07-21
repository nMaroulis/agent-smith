import React from 'react';
import { FiLayers } from 'react-icons/fi';

const RAGLabPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white p-8">
      <div className="text-center max-w-2xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/10 mb-4">
          <FiLayers className="w-8 h-8 text-indigo-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">RAG Lab</h1>
        <p className="text-gray-400 mb-8">
          Coming soon! This is where you'll be able to build and test your own RAG applications.
        </p>
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-200 mb-4">What to expect:</h2>
          <ul className="space-y-3 text-left text-gray-300">
            <li className="flex items-start">
              <span className="text-indigo-400 mr-2">•</span>
              <span>Build and test your own RAG applications</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-400 mr-2">•</span>
              <span>Monitor RAG application performance and metrics</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-400 mr-2">•</span>
              <span>Deploy RAG applications with one click</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};


export default RAGLabPage;
