
import React from 'react';

interface ReviewOutputProps {
  feedback: string;
}

export const ReviewOutput: React.FC<ReviewOutputProps> = ({ feedback }) => {
  // This component will display text with pre-wrap.
  // For true Markdown rendering, a library like react-markdown would be needed,
  // but for simplicity and to adhere to constraints, we'll use pre-wrap.
  // Gemini's markdown will have its formatting (like *bold*, _italic_, ```code```)
  // displayed as raw text, but line breaks and spacing will be preserved.
  return (
    <div className="mt-6">
      <h2 className="text-2xl font-semibold text-slate-200 mb-3">Review Feedback:</h2>
      <div className="p-4 bg-slate-700 border border-slate-600 rounded-lg shadow-md overflow-x-auto">
        <pre className="text-slate-200 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">
          {feedback}
        </pre>
      </div>
    </div>
  );
};
