import React from 'react';

export default function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-orange-100/70 dark:bg-orange-900/20 ${className}`} />
  );
}
