// Question text supports exactly two inline marks: `code` and **underlined word**.
// The real paper underlines a word in a sentence, so that is how the emphasis is shown.
// Text is rendered as React nodes, never as HTML, so question content cannot inject markup.

const INLINE = /(`[^`\n]+`|\*\*[^*\n]+\*\*)/g;

export function RichText({ text }) {
  const parts = String(text).split(INLINE);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return <code key={i}>{part.slice(1, -1)}</code>;
        }
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return <u key={i}>{part.slice(2, -2)}</u>;
        }
        return part;
      })}
    </>
  );
}
