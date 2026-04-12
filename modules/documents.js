export function createUniqueTitle(titles, title) {
  if (titles.includes(title)) {
    let number = 1;
    while (titles.includes(`${title}-${number}`)) {
      number++;
    }
    return `${title}-${number}`;
  }
  return title;
}

export function sanitizeTitle(title) {
  if (!title) return 'untitled';
  const sanitized = title
      .replace(/[\/\\?#*:<>|"\x00-\x1f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[-.]+|[-.]+$/g, '')
      .substring(0, 100);
  return sanitized || 'untitled';
}
