import React, { useEffect, useRef, useState } from 'react';
import sdk from '@stackblitz/sdk';

interface StackBlitzEmbedProps {
  elementId: string;
  project: {
    title: string;
    description: string;
    template: 'react-ts' | 'node' | 'html';
    files: Record<string, string>;
    settings?: {
      compile?: {
        trigger?: 'auto' | 'save' | 'manual';
        clearConsole?: boolean;
      };
    };
  };
  height?: string | number;
  className?: string;
}

export default function StackBlitzEmbed({
  elementId,
  project,
  height = '500px',
  className = ''
}: StackBlitzEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const embedAttempts = useRef(0);
  const maxAttempts = 3;

  useEffect(() => {
    const embedProject = async () => {
      if (!containerRef.current) return;

      try {
        setLoading(true);
        setError(null);
        embedAttempts.current++;

        await sdk.embedProject(
          containerRef.current,
          {
            title: project.title,
            description: project.description,
            template: project.template,
            files: project.files,
            settings: {
              ...project.settings,
              compile: {
                trigger: 'auto',
                clearConsole: true,
                ...project.settings?.compile
              }
            }
          },
          {
            height: typeof height === 'number' ? `${height}px` : height,
            clickToLoad: true, // Changed to true to improve initial load reliability
            hideExplorer: false,
            hideNavigation: false,
            terminalHeight: 40,
            forceEmbedLayout: true,
            openFile: 'index.tsx'
          }
        );

        setLoading(false);
      } catch (error) {
        console.error('Error embedding StackBlitz project:', error);
        
        // Retry logic
        if (embedAttempts.current < maxAttempts) {
          setTimeout(embedProject, 2000); // Retry after 2 seconds
        } else {
          setError('Failed to load StackBlitz editor. Please try refreshing the page.');
          setLoading(false);
        }
      }
    };

    embedProject();
  }, [project, height]);

  if (error) {
    return (
      <div className={`w-full rounded-lg overflow-hidden bg-red-50 border border-red-200 p-4 ${className}`}>
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => {
            embedAttempts.current = 0;
            setError(null);
            setLoading(true);
          }}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`relative w-full rounded-lg overflow-hidden shadow-lg ${className}`}>
      <div 
        ref={containerRef}
        id={elementId}
        style={{ height }}
      />
      {loading && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-gray-600">Loading editor...</p>
          </div>
        </div>
      )}
    </div>
  );
}