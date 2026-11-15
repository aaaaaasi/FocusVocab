'use client';

import React from 'react';

let lastActionClickTime = 0;

export interface SafeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  debounceMs?: number;
  skipDebounce?: boolean;
}

export function SafeButton({
  onClick,
  debounceMs = 150,
  skipDebounce = false,
  className = '',
  children,
  ...rest
}: SafeButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    if (!skipDebounce) {
      const now = Date.now();
      if (now - lastActionClickTime < debounceMs) {
        return;
      }
      lastActionClickTime = now;
    }
    onClick?.(e);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      {...rest}
    >
      {children}
    </button>
  );
}
