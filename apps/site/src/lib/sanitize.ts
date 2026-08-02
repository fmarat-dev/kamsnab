import sanitizeHtml from "sanitize-html";

// Контент из CMS (rich-text редактор Directus) редактируют только админы,
// но на случай компрометации админ-аккаунта не рендерим его как есть.
export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["h1", "h2", "img"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "width", "height"]
    }
  });
}
