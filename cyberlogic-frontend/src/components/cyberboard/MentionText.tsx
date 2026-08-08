interface MentionTextProps {
  content: string;
  className?: string;
}

export default function MentionText({ content, className = "" }: MentionTextProps) {
  if (!content) return null;

  // Check if content is HTML from WYSIWYG editor
  const isHtml =
    content.includes("<p>") ||
    content.includes("<strong>") ||
    content.includes("<b>") ||
    content.includes("<em>") ||
    content.includes("<i>") ||
    content.includes("<u>") ||
    content.includes("<del>") ||
    content.includes("<code>") ||
    content.includes("<h3>") ||
    content.includes("<ul>") ||
    content.includes("<li>") ||
    content.includes("<blockquote>") ||
    content.includes("<pre>");

  const htmlContent = isHtml
    ? content
    : content
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/~~(.*?)~~/g, "<del>$1</del>")
        .replace(/<u>(.*?)<\/u>/g, "<u>$1</u>")
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\n/g, "<br>");

  return (
    <span
      className={`inline-wrap prose prose-invert max-w-none text-xs sm:text-sm text-text-primary leading-relaxed [&_h3]:text-base [&_h3]:font-black [&_h3]:text-primary [&_h3]:my-1 [&_blockquote]:border-l-2 [&_blockquote]:border-cyan-400 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-text-muted [&_pre]:bg-surface-950 [&_pre]:p-2.5 [&_pre]:rounded-xl [&_pre]:font-mono [&_pre]:text-cyan-400 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
