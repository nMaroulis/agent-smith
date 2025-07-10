import React from 'react';

const ToolTesterPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-900 p-6 rounded-lg">
      <div className="max-w-4xl w-full bg-gray-800 rounded-xl shadow-xl p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Tool Tester</h1>
        <div className="bg-gray-700 rounded-lg p-4 min-h-[400px]">
          <p className="text-gray-300">Tool testing interface will be implemented here.</p>
        </div>
      </div>
    </div>
  );
};

export default ToolTesterPage;
