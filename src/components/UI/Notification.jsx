import React from 'react';

export default function Notification(props) {
  let specialClasses = '';

  if (props.status === 'error') {
    specialClasses = 'bg-rose-950/20 border-rose-900/40 text-rose-300';
  }
  if (props.status === 'success') {
    specialClasses = 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300';
  }
  if (props.status === 'pending') {
    specialClasses = 'bg-indigo-950/20 border-indigo-900/40 text-indigo-300';
  }

  return (
    <section className={`w-full py-3 px-6 border rounded-xl text-xs flex justify-between items-center transition-all animate-fade-in ${specialClasses}`}>
      <h2 className="font-bold uppercase tracking-wider">{props.title}</h2>
      <p className="font-medium">{props.message}</p>
    </section>
  );
}
