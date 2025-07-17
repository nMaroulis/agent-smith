import React from 'react';
import { FiCpu } from 'react-icons/fi';

const LLMFinetuningPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white p-8">
      <div className="text-center max-w-2xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/10 mb-4">
          <FiCpu className="w-8 h-8 text-indigo-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">LLM Finetuning</h1>
        <p className="text-gray-400 mb-8">
          Coming soon! This is where you'll be able to fine-tune your own language models.
        </p>
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-200 mb-4">What to expect:</h2>
          <ul className="space-y-3 text-left text-gray-300">
            <li className="flex items-start">
              <span className="text-indigo-400 mr-2">•</span>
              <span>Fine-tune models on your custom datasets</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-400 mr-2">•</span>
              <span>Monitor training progress and metrics</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-400 mr-2">•</span>
              <span>Deploy fine-tuned models with one click</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LLMFinetuningPage;
