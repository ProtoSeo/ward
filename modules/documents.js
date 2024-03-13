export function createFileReadme(title, tags, tabUrl) {
  let readme = "---\n" +
      `title: "${title}"\n` +
      `url: ${tabUrl}\n` +
      `tag: ${tags.join(', ')}\n` +
      "---\n\n";
  readme += `# [${title}](${tabUrl})\n\n### URL\n\n- ${tabUrl}\n\n`;
  if (tags.length > 0) {
    readme += '### Tag\n\n';
    tags.forEach((tag) => readme += `- ${tag}\n`);
  }
  return readme;
}

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
