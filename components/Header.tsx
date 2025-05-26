
import React from 'react';
import { CodeIcon } from './icons/CodeIcon';

export const Header: React.FC = () => {
  return (
    <header className="text-center">
      <div className="flex items-center justify-center space-x-3 mb-2">
        <CodeIcon className="h-10 w-10 text-sky-400" />
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
          AI Code Reviewer
        </h1>
      </div>
      <p className="text-slate-400 text-lg">
        Get instant, AI-powered feedback on your code snippets.
      </p>
    </header>
  );
};
