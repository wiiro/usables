import Markdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

// react-markdown não interpreta HTML escrito no texto e bloqueia links
// "javascript:", então o conteúdo é exibido com segurança. Não ative
// rehype-raw sem pensar nisso.

const PLUGINS = [remarkGfm];

const COMPONENTS: Components = {
  // Links abrem em outra aba, sem dar à página aberta acesso a esta.
  a: ({ href, title, children }) => (
    <a href={href} title={title} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

/** Texto em Markdown (com tabelas, listas de tarefas e riscado do GFM). Estilo em index.css (.markdown). */
export function MarkdownView({ source, className = '' }: { source: string; className?: string }) {
  return (
    <div className={`markdown ${className}`}>
      <Markdown remarkPlugins={PLUGINS} components={COMPONENTS}>
        {source}
      </Markdown>
    </div>
  );
}
