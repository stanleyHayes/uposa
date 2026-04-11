import Markdown from 'react-markdown';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export default function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  return (
    <div className={`prose prose-slate max-w-none prose-headings:text-base-content prose-p:text-base-content/70 prose-a:text-primary prose-strong:text-base-content prose-li:text-base-content/70 prose-img:rounded-xl ${className}`}>
      <Markdown>{content}</Markdown>
    </div>
  );
}
