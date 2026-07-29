import React from 'react';

const ModulePlaceholder = ({ title, phase, description }) => (
  <div className="rounded-2xl border border-dashed border-orange-200 bg-white p-8 text-center shadow-sm">
    <p className="text-xs font-bold uppercase tracking-wider text-orange-500">{phase}</p>
    <h1 className="mt-2 text-2xl font-bold text-slate-800">{title}</h1>
    <p className="mx-auto mt-3 max-w-lg text-sm text-slate-500">
      {description || 'This module will be built in the next development phase.'}
    </p>
  </div>
);

export default ModulePlaceholder;
