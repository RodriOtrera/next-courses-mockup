/**
 * Renders a structured-data block.
 *
 * The `<` escape is not optional. Course descriptions and FAQ answers are
 * operator-authored free text typed into a <Textarea>; a literal `</script>`
 * anywhere in that content would close this tag early and let the remainder
 * execute as markup. Escaping `<` to its JSON unicode form is inert inside
 * JSON-LD and closes that hole.
 */
export default function JsonLd({ data }: { data: object | null }) {
  if (!data) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
