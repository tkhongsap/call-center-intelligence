'use client';

import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

function formatTime(date: Date, locale: string = 'en') {
  const localeCode = locale === 'th' ? 'th-TH' : 'en-US';
  return date.toLocaleTimeString(localeCode, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function parseMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const lines = text.split('\n');
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle bullet points
    if (line.match(/^[-*•]\s/)) {
      const content = line.replace(/^[-*•]\s/, '');
      nodes.push(
        <div key={key++} className="flex gap-2 ml-2">
          <span>•</span>
          <span>{parseInline(content)}</span>
        </div>
      );
      continue;
    }

    // Handle numbered lists
    if (line.match(/^\d+\.\s/)) {
      const match = line.match(/^(\d+)\.\s(.*)$/);
      if (match) {
        nodes.push(
          <div key={key++} className="flex gap-2 ml-2">
            <span>{match[1]}.</span>
            <span>{parseInline(match[2])}</span>
          </div>
        );
        continue;
      }
    }

    // Regular line with inline formatting
    if (line.trim()) {
      nodes.push(<p key={key++}>{parseInline(line)}</p>);
    } else if (i < lines.length - 1) {
      // Empty line = paragraph break (but not at the end)
      nodes.push(<br key={key++} />);
    }
  }

  return nodes;
}

function parseInline(text: string): React.ReactNode {
  const elements: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining) {
    // Bold: **text** or __text__
    const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*/);
    if (boldMatch) {
      if (boldMatch[1]) elements.push(parseInline(boldMatch[1]));
      elements.push(<strong key={`bold-${key++}`}>{parseInline(boldMatch[2])}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic: *text* or _text_
    const italicMatch = remaining.match(/^(.*?)\*(.+?)\*/);
    if (italicMatch && !remaining.match(/^\*\*/)) {
      if (italicMatch[1]) elements.push(italicMatch[1]);
      elements.push(<em key={`italic-${key++}`}>{italicMatch[2]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Inline code: `code`
    const codeMatch = remaining.match(/^(.*?)`([^`]+)`/);
    if (codeMatch) {
      if (codeMatch[1]) elements.push(codeMatch[1]);
      elements.push(
        <code
          key={`code-${key++}`}
          className="px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded text-xs font-mono"
        >
          {codeMatch[2]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Links: [text](url)
    const linkMatch = remaining.match(/^(.*?)\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      if (linkMatch[1]) elements.push(linkMatch[1]);
      elements.push(
        <a
          key={`link-${key++}`}
          href={linkMatch[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {linkMatch[2]}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // No more patterns, add remaining text and break
    elements.push(remaining);
    break;
  }

  return elements.length === 1 ? elements[0] : elements;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const locale = useLocale();
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex flex-col',
        isUser ? 'items-end' : 'items-start'
      )}
    >
      <div
        className={cn(
          'max-w-[85%] px-4 py-2.5 rounded-2xl text-sm',
          isUser
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-slate-100 text-slate-900 rounded-bl-md'
        )}
      >
        {isUser ? (
          message.content
        ) : (
          <div className="space-y-1 [&>p]:leading-relaxed">
            {parseMarkdown(message.content)}
          </div>
        )}
      </div>
      <span className="text-xs text-slate-400 mt-1 px-1">
        {formatTime(message.timestamp, locale)}
      </span>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-start">
      <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex gap-1">
          <span
            className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  );
}
