export function stripHtml(html) {
  if (html) {
    return html.replace(/<\/?("[^"]*"|'[^']*'|[^>])*(>|$)/g, "");
  } else {
    return "";
  }
}
