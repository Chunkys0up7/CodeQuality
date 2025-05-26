
import React, { useState, useCallback, ChangeEvent } from 'react';
import { ReviewOutput } from './components/ReviewOutput';
import { ActionButton } from './components/ActionButton';
import { Header } from './components/Header';
import { Spinner } from './components/Spinner';
import { ProjectInput, ProjectFile } from './components/ProjectInput';
import { getProjectReviewFeedback } from './services/geminiService';

const App: React.FC = () => {
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = useCallback((files: ProjectFile[], folderName: string | null) => {
    setProjectFiles(files);
    setProjectName(folderName);
    setFeedback(null);
    setError(null);
  }, []);

  const handleReviewProject = useCallback(async () => {
    if (projectFiles.length === 0) {
      setError('Please select a project folder to review, or ensure it contains reviewable files.');
      setFeedback(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    setFeedback(null);
    try {
      const review = await getProjectReviewFeedback(projectFiles, projectName || "Unnamed Project");
      setFeedback(review);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while reviewing the project.');
      }
      console.error("Review Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [projectFiles, projectName]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 flex flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl bg-slate-800 shadow-2xl rounded-xl p-6 md:p-8">
        <Header />
        
        <div className="mt-8 space-y-6">
          <ProjectInput onFilesSelected={handleFilesSelected} disabled={isLoading} />
          
          {projectFiles.length > 0 && !isLoading && (
            <div className="mt-4 p-4 bg-slate-700/50 border border-slate-600 rounded-md shadow-sm">
              <p className="font-semibold text-sky-400">Project: {projectName || 'Selected Folder'}</p>
              <p className="text-sm text-slate-400">{projectFiles.length} file(s) ready for review.</p>
              {/* Optionally list files, but could be long. For now, just a count. */}
            </div>
          )}

          <ActionButton
            onClick={handleReviewProject}
            isLoading={isLoading}
            disabled={isLoading || projectFiles.length === 0}
          >
            {isLoading ? 'Reviewing Project...' : 'Review Project'}
          </ActionButton>
          
          {error && (
            <div className="mt-4 p-4 bg-red-700 border border-red-600 text-red-100 rounded-md shadow-md" role="alert">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {isLoading && !feedback && !error && (
            <div className="mt-6 flex flex-col items-center justify-center p-6 bg-slate-700 rounded-md shadow-md">
              <Spinner />
              <p className="mt-3 text-slate-300 text-lg">Analyzing your project files...</p>
              <p className="text-sm text-slate-400">This may take a few moments for larger projects.</p>
            </div>
          )}
          
          {feedback && !error && (
            <ReviewOutput feedback={feedback} />
          )}
        </div>
        <footer className="mt-12 text-center text-sm text-slate-500">
          <p>Powered by Gemini API & React. Designed for educational and illustrative purposes.</p>
          <p>Ensure your API_KEY environment variable is set.</p>
          <p className="mt-1 text-xs text-slate-600">Note: Very large projects might exceed API limits. Review might be truncated or fail.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
