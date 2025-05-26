
import React from 'react';
import { Spinner } from './Spinner'; // Using the same spinner for button too

interface ActionButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  children,
  isLoading = false,
  disabled = false,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading && <Spinner className="w-5 h-5 mr-2 -ml-1" />}
      {children}
    </button>
  );
};
