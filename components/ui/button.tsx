import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: React.ReactNode;
}

export function Button({ className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-md transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
} 
