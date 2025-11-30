import React from 'react';
import ReactMarkdown from 'react-markdown';
import { DownloadCard } from './DownloadCard';

interface MessageParserProps {
  content: string;
  role: 'user' | 'assistant';
}

interface FileData {
  type: 'file_generated';
  file: {
    url: string;
    filename: string;
    size?: number;
    mimeType?: string;
    expiresAt?: string;
    format?: string;
  };
  message?: string;
}

export const MessageParser: React.FC<MessageParserProps> = ({ content, role }) => {
  // Tentar parsear JSON de arquivo gerado
  const tryParseFileData = (text: string): FileData | null => {
    try {
      // Procurar por JSON no texto
      const jsonMatch = text.match(/\{[\s\S]*"type"\s*:\s*"file_generated"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.type === 'file_generated' && parsed.file) {
          return parsed;
        }
      }
    } catch (e) {
      // Não é JSON válido
    }
    return null;
  };

  // Detectar links de download no texto
  const detectDownloadLinks = (text: string): Array<{ url: string; filename: string; text: string }> => {
    const links: Array<{ url: string; filename: string; text: string }> = [];

    // Padrão para URLs de storage do Supabase
    const storagePattern = /https?:\/\/[^\s]+\.supabase\.co\/storage\/[^\s]+/g;
    const matches = text.match(storagePattern);

    if (matches) {
      matches.forEach(url => {
        // Extrair filename da URL
        const parts = url.split('/');
        const filename = parts[parts.length - 1].split('?')[0];

        links.push({
          url,
          filename: decodeURIComponent(filename),
          text: url
        });
      });
    }

    // Padrão para links markdown: [texto](url)
    const markdownPattern = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
    let match;
    while ((match = markdownPattern.exec(text)) !== null) {
      const [, linkText, url] = match;
      if (url.includes('storage') || url.includes('temp-files')) {
        const parts = url.split('/');
        const filename = parts[parts.length - 1].split('?')[0];

        links.push({
          url,
          filename: linkText.includes('.') ? linkText : decodeURIComponent(filename),
          text: linkText
        });
      }
    }

    return links;
  };

  // Tentar detectar arquivo gerado
  const fileData = tryParseFileData(content);

  if (fileData) {
    // Remover JSON do conteúdo para exibir apenas a mensagem
    const cleanContent = content.replace(/\{[\s\S]*"type"\s*:\s*"file_generated"[\s\S]*\}/, '').trim();

    return (
      <div className="space-y-3">
        {cleanContent && (
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown>{cleanContent}</ReactMarkdown>
          </div>
        )}
        <DownloadCard file={fileData.file} message={fileData.message} />
      </div>
    );
  }

  // Detectar links de download no texto
  const downloadLinks = detectDownloadLinks(content);

  if (downloadLinks.length > 0 && role === 'assistant') {
    // Remover URLs do conteúdo e substituir por placeholders
    let cleanContent = content;
    const renderedLinks = new Set<string>();

    downloadLinks.forEach((link, index) => {
      if (!renderedLinks.has(link.url)) {
        cleanContent = cleanContent.replace(link.url, `[DOWNLOAD_${index}]`);
        renderedLinks.add(link.url);
      }
    });

    // Remover links markdown duplicados
    const markdownLinkPattern = /\[([^\]]+)\]\(https?:\/\/[^\)]+\)/g;
    cleanContent = cleanContent.replace(markdownLinkPattern, (match, text) => {
      const link = downloadLinks.find(l => match.includes(l.url));
      return link ? `[DOWNLOAD_LINK]` : match;
    });

    return (
      <div className="space-y-3">
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              // Customizar renderização de links
              a: ({ node, href, children, ...props }) => {
                // Se for link de storage, não renderizar como link normal
                if (href && (href.includes('storage') || href.includes('temp-files'))) {
                  return <span className="text-blue-600 dark:text-blue-400">{children}</span>;
                }
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                    {...props}
                  >
                    {children}
                  </a>
                );
              },
              // Melhorar renderização de código
              code: ({ node, inline, className, children, ...props }) => {
                if (inline) {
                  return (
                    <code
                      className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }
                return (
                  <code
                    className={`block bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto ${className || ''}`}
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {cleanContent
              .replace(/\[DOWNLOAD_\d+\]/g, '')
              .replace(/\[DOWNLOAD_LINK\]/g, '')
              .trim()}
          </ReactMarkdown>
        </div>

        {/* Renderizar cards de download */}
        {Array.from(renderedLinks).map((url, index) => {
          const link = downloadLinks.find(l => l.url === url);
          if (!link) return null;

          // Tentar extrair informações do filename
          const filename = link.filename;
          const extension = filename.split('.').pop()?.toLowerCase();
          let mimeType = 'application/octet-stream';
          let format = extension;

          if (extension === 'csv') {
            mimeType = 'text/csv';
          } else if (extension === 'xlsx' || extension === 'xls') {
            mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            format = 'excel';
          } else if (extension === 'pdf') {
            mimeType = 'application/pdf';
          } else if (extension === 'json') {
            mimeType = 'application/json';
          }

          return (
            <DownloadCard
              key={index}
              file={{
                url: link.url,
                filename: filename,
                mimeType: mimeType,
                format: format,
              }}
              message="Arquivo disponível para download"
            />
          );
        })}
      </div>
    );
  }

  // Renderização padrão com Markdown
  return (
    <div className="prose dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
          a: ({ node, href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
              {...props}
            >
              {children}
            </a>
          ),
          code: ({ node, inline, className, children, ...props }) => {
            if (inline) {
              return (
                <code
                  className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className={`block bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto ${className || ''}`}
                {...props}
              >
                {children}
              </code>
            );
          },
          p: ({ node, children, ...props }) => (
            <p className="mb-3 last:mb-0" {...props}>
              {children}
            </p>
          ),
          ul: ({ node, children, ...props }) => (
            <ul className="list-disc list-inside mb-3 space-y-1" {...props}>
              {children}
            </ul>
          ),
          ol: ({ node, children, ...props }) => (
            <ol className="list-decimal list-inside mb-3 space-y-1" {...props}>
              {children}
            </ol>
          ),
          h1: ({ node, children, ...props }) => (
            <h1 className="text-2xl font-bold mb-3 mt-4" {...props}>
              {children}
            </h1>
          ),
          h2: ({ node, children, ...props }) => (
            <h2 className="text-xl font-bold mb-2 mt-3" {...props}>
              {children}
            </h2>
          ),
          h3: ({ node, children, ...props }) => (
            <h3 className="text-lg font-semibold mb-2 mt-2" {...props}>
              {children}
            </h3>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MessageParser;
