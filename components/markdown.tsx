'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Components } from 'react-markdown';

interface MarkdownProps {
  content: string;
  className?: string;
}

interface CodeProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Markdown({ content, className }: MarkdownProps) {
  const components: Components = {
    a: (props) => (
      <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline" />
    ),
    p: (props) => <p {...props} className="mb-4" />,
    h1: (props) => <h1 {...props} className="text-3xl font-bold mb-4" />,
    h2: (props) => <h2 {...props} className="text-2xl font-bold mb-3" />,
    h3: (props) => <h3 {...props} className="text-xl font-bold mb-2" />,
    ul: (props) => <ul {...props} className="list-disc pl-6 mb-4" />,
    ol: (props) => <ol {...props} className="list-decimal pl-6 mb-4" />,
    li: (props) => <li {...props} className="mb-1" />,
    code: ({ inline, children, ...props }: CodeProps) => (
      inline ? 
        <code {...props} className="bg-gray-100 rounded px-1 py-0.5 font-mono text-sm">{children}</code> :
        <code {...props} className="block bg-gray-100 rounded p-4 font-mono text-sm mb-4">{children}</code>
    ),
    blockquote: (props) => (
      <blockquote {...props} className="border-l-4 border-gray-300 pl-4 italic my-4" />
    ),
  };

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
} 