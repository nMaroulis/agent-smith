import { useState, lazy, Suspense } from 'react';
import { FiMaximize2, FiMinimize2, FiX } from 'react-icons/fi';

// Lazy load the Monaco Editor
const MonacoEditor = lazy(() => import('@monaco-editor/react'));

interface CodeEditorProps {
  code: string;
  onCodeChange: (value: string | undefined) => void;
  previewCode?: string;
  isPreview?: boolean;
  language?: string;
}

const EditorLoading = () => (
  <div className="h-full w-full flex items-center justify-center bg-black/50">
    <div className="animate-pulse text-gray-400">Loading editor...</div>
  </div>
);

export const CodeEditorConfig: React.FC<CodeEditorProps> = ({
  code,
  onCodeChange,
  previewCode = '',
  isPreview = false,
  language = 'python'
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    // You can access the editor instance here if needed
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-1">
        <label className="block text-sm font-medium text-gray-300">
          {isPreview ? 'Generated Code Preview' : 'Code'}
        </label>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded flex items-center gap-1"
          aria-label={isFullscreen ? 'Minimize' : 'Maximize'}
        >
          {isFullscreen ? (
            <>
              <FiMinimize2 size={12} />
              <span>Minimize</span>
            </>
          ) : (
            <>
              <FiMaximize2 size={12} />
              <span>Fullscreen</span>
            </>
          )}
        </button>
      </div>
      
      <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900 p-4' : 'relative'}`}>
        {isFullscreen && (
          <div className="absolute top-4 right-4 z-10">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="text-gray-300 hover:text-white p-1 bg-gray-800 rounded-full"
              aria-label="Exit fullscreen"
            >
              <FiX size={20} />
            </button>
          </div>
        )}
        
        {isPreview ? (
          <div className="h-[80vh] w-full bg-gray-900 p-4 rounded-md overflow-auto">
            <pre className="text-gray-200 text-sm font-mono whitespace-pre-wrap">
              {previewCode || 'No code generated'}
            </pre>
          </div>
        ) : (
          <div className={`${isFullscreen ? 'h-[calc(100vh-4rem)]' : 'h-96'} w-full`}>
            <Suspense fallback={<EditorLoading />}>
              <MonacoEditor
                height="100%"
                language={language}
                theme="vs-dark"
                value={code}
                onChange={onCodeChange}
                onMount={handleEditorDidMount}
                options={{
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
              />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditorConfig;
