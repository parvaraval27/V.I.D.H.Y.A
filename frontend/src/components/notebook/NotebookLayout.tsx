import React from 'react';

interface NotebookLayoutProps {
  title?: React.ReactNode;
  beforeTitle?: React.ReactNode;
  children: React.ReactNode;
  full?: boolean;
  wide?: boolean; 
}

export default function NotebookLayout({ title, beforeTitle, children, full = true, wide = false }: NotebookLayoutProps) {
  return (
    <section className={`notebook ${full ? 'notebook-full' : ''} mb-6 overflow-x-hidden mx-auto max-w-[1495px] px-1 sm:px-4`}>
      <div className="spiral hidden md:flex flex-col items-center justify-center">
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} className="block w-2 h-2 bg-gray-300 rounded-full my-1" />
        ))}
      </div>

        <div className={wide ? 'pl-2 sm:pl-4 md:pl-12 pr-2 sm:pr-4 md:pr-12 w-full mx-auto max-w-[1200px] box-border' : 'pl-2 sm:pl-4 md:pl-12 pr-2 sm:pr-4 md:pr-12 w-full max-w-[1200px] mx-auto box-border'}>
        {beforeTitle && <div className="mb-2">{beforeTitle}</div>}
        {title && <h2 className="font-hand text-2xl mb-4">{title}</h2>}
        <div>{children}</div>
      </div>
    </section>
  );
}
