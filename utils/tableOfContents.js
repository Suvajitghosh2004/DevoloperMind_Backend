const slugify = require('slugify');

function buildTableOfContents(html) {
  if (!html) return { content: html, tableOfContents: [] };

  const tableOfContents = [];
  const seenAnchors = new Set();

  const headingRegex = /<(h2|h3)([^>]*)>([\s\S]*?)<\/\1>/gi;

  const content = html.replace(headingRegex, (match, tag, attrs, inner) => {
    const headingText = inner.replace(/<[^>]+>/g, '').trim();
    if (!headingText) return match;

    let anchor = slugify(headingText, { lower: true, strict: true }) || 'section';
    let uniqueAnchor = anchor;
    let i = 2;
    while (seenAnchors.has(uniqueAnchor)) {
      uniqueAnchor = `${anchor}-${i++}`;
    }
    seenAnchors.add(uniqueAnchor);

    tableOfContents.push({
      heading: headingText,
      anchor: uniqueAnchor,
      level: tag.toLowerCase() === 'h2' ? 2 : 3
    });

    const attrsWithoutId = attrs.replace(/\sid="[^"]*"/i, '');
    return `<${tag}${attrsWithoutId} id="${uniqueAnchor}">${inner}</${tag}>`;
  });

  return { content, tableOfContents };
}

module.exports = { buildTableOfContents };