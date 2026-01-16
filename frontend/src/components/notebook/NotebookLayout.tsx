import React from 'react';

interface NotebookLayoutProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  full?: boolean;
}

export default function NotebookLayout({ title, children, full = true }: NotebookLayoutProps) {
  return (
    <section className={`notebook ${full ? 'notebook-full' : ''} mb-6`}> 
      <div className="spiral hidden md:flex flex-col items-center justify-center">
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} className="block w-2 h-2 bg-gray-300 rounded-full my-1" />
        ))}
      </div>

      <div className="ml-12 max-w-6xl mx-auto">
        {title && <h2 className="font-hand text-2xl mb-4">{title}</h2>}
        <div>{children}</div>
      </div>
    </section>
  );
}
