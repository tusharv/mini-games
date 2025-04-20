'use client';

import React from 'react';

interface DropdownMenuProps {
  children: React.ReactNode;
}

interface DropdownMenuTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
}

interface DropdownMenuItemProps {
  onClick?: () => void;
  children: React.ReactNode;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  return <div className="relative inline-block text-left">{children}</div>;
}

export function DropdownMenuTrigger({ children }: DropdownMenuTriggerProps) {
  return <div className="cursor-pointer">{children}</div>;
}

export function DropdownMenuContent({ children }: DropdownMenuContentProps) {
  return (
    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
      <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
        {children}
      </div>
    </div>
  );
}

export function DropdownMenuItem({ onClick, children }: DropdownMenuItemProps) {
  return (
    <div
      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
      role="menuitem"
      onClick={onClick}
    >
      {children}
    </div>
  );
} 
