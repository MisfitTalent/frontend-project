"use client";

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const applyInlineFormatting = (value: string) => {
  let html = escapeHtml(value);

  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer" class="assistant-rich-link">$1</a>',
  );
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/\\\((.+?)\\\)/g, '<span class="assistant-math-inline">$1</span>');

  return html;
};

const isTableSeparator = (line: string) =>
  /^\s*\|?(\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/.test(line);

const splitTableCells = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

const renderTable = (lines: string[]) => {
  const [headerLine, , ...rowLines] = lines;
  const headers = splitTableCells(headerLine);
  const rows = rowLines.map(splitTableCells);

  const headHtml = headers
    .map((cell) => `<th>${applyInlineFormatting(cell)}</th>`)
    .join("");
  const bodyHtml = rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell) => `<td>${applyInlineFormatting(cell)}</td>`)
          .join("")}</tr>`,
    )
    .join("");

  return `<div class="assistant-table-wrap"><table><thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`;
};

const renderList = (lines: string[]) => {
  const ordered = /^\s*\d+\.\s+/.test(lines[0]);
  const tag = ordered ? "ol" : "ul";
  const items = lines
    .map((line) =>
      line.replace(/^\s*(?:[-*]|\d+\.)\s+/, ""),
    )
    .map((item) => `<li>${applyInlineFormatting(item)}</li>`)
    .join("");

  return `<${tag}>${items}</${tag}>`;
};

const renderParagraph = (lines: string[]) =>
  `<p>${lines.map((line) => applyInlineFormatting(line)).join("<br />")}</p>`;

const renderMarkdown = (content: string) => {
  const normalized = content.replace(/\r\n/g, "\n").trim();

  if (!normalized) {
    return "";
  }

  const lines = normalized.split("\n");
  const blocks: string[] = [];

  for (let index = 0; index < lines.length; ) {
    const currentLine = lines[index].trimEnd();

    if (!currentLine.trim()) {
      index += 1;
      continue;
    }

    if (currentLine.startsWith("```")) {
      const codeLines: string[] = [];
      const language = currentLine.slice(3).trim();
      index += 1;

      while (index < lines.length && !lines[index].trimStart().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      index += 1;
      blocks.push(
        `<pre><code class="${language ? `language-${escapeHtml(language)}` : ""}">${escapeHtml(codeLines.join("\n"))}</code></pre>`,
      );
      continue;
    }

    if (/^---+$/.test(currentLine.trim())) {
      blocks.push("<hr />");
      index += 1;
      continue;
    }

    if (/^#{1,6}\s+/.test(currentLine)) {
      const level = currentLine.match(/^#+/)?.[0].length ?? 1;
      const text = currentLine.replace(/^#{1,6}\s+/, "");
      blocks.push(`<h${level}>${applyInlineFormatting(text)}</h${level}>`);
      index += 1;
      continue;
    }

    if (currentLine.trim().startsWith("\\[")) {
      const mathLines = [currentLine];
      index += 1;

      while (index < lines.length && !lines[index].includes("\\]")) {
        mathLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) {
        mathLines.push(lines[index]);
        index += 1;
      }

      blocks.push(
        `<div class="assistant-math-block">${escapeHtml(mathLines.join("\n"))}</div>`,
      );
      continue;
    }

    if (
      currentLine.includes("|") &&
      index + 1 < lines.length &&
      isTableSeparator(lines[index + 1])
    ) {
      const tableLines = [currentLine, lines[index + 1]];
      index += 2;

      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
        tableLines.push(lines[index]);
        index += 1;
      }

      blocks.push(renderTable(tableLines));
      continue;
    }

    if (/^\s*(?:[-*]|\d+\.)\s+/.test(currentLine)) {
      const listLines: string[] = [];

      while (index < lines.length && /^\s*(?:[-*]|\d+\.)\s+/.test(lines[index])) {
        listLines.push(lines[index]);
        index += 1;
      }

      blocks.push(renderList(listLines));
      continue;
    }

    const paragraphLines: string[] = [];

    while (index < lines.length) {
      const nextLine = lines[index];
      const trimmed = nextLine.trim();

      if (
        !trimmed ||
        trimmed.startsWith("```") ||
        /^#{1,6}\s+/.test(trimmed) ||
        /^---+$/.test(trimmed) ||
        /^\s*(?:[-*]|\d+\.)\s+/.test(nextLine) ||
        trimmed.startsWith("\\[") ||
        (trimmed.includes("|") &&
          index + 1 < lines.length &&
          isTableSeparator(lines[index + 1]))
      ) {
        break;
      }

      paragraphLines.push(trimmed);
      index += 1;
    }

    blocks.push(renderParagraph(paragraphLines));
  }

  return blocks.join("");
};

export function AssistantRichText({
  className,
  content,
}: Readonly<{
  className?: string;
  content: string;
}>) {
  return (
    <div
      className={["assistant-rich-text", className].filter(Boolean).join(" ")}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}
