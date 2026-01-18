import React from 'react';

interface NotebookLayoutProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  full?: boolean;
  wide?: boolean; // when true, content spans more horizontally and avoids centered max-width
}

export default function NotebookLayout({ title, children, full = true, wide = false }: NotebookLayoutProps) {
  return (
    <section className={`notebook ${full ? 'notebook-full' : ''} mb-6`}> 
      <div className="spiral hidden md:flex flex-col items-center justify-center">
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} className="block w-2 h-2 bg-gray-300 rounded-full my-1" />
        ))}
      </div>

      <div className={wide ? 'pl-12 w-full mx-0 max-w-none' : 'pl-12 w-full max-w-8xl mx-auto'}>
        {title && <h2 className="font-hand text-2xl mb-4">{title}</h2>}
        <div>{children}</div>
      </div>
    </section>
  );
}
