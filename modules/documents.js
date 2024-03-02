export function createFileReadme(title, tags, tabUrl) {
  let readme = `# [${title}](${tabUrl})\n\n### URL\n\n- ${tabUrl}\n\n`;
  if (tags.length > 0) {
    readme += '### Tag\n\n';
    tags.forEach((tag) => readme += `- ${tag}\n`);
  }
  return readme;
}

export function createDefaultReadme(name) {
  let readme = `# ${name}\n\n`
  readme += '<table>\n'
      + '  <tr>\n'
      + '    <td>제목</td>\n'
      + '    <td>주소</td>\n'
      + '    <td>태그</td>\n'
      + '  </tr>\n'
      + '</table>\n'
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

export function updateDefaultReadme(content, title, tags, tabUrl) {
  const index = content.lastIndexOf('</table>');
  const information = '  <tr>\n'
      + `    <td>${title}</td>\n`
      + `    <td><a href="${tabUrl}">${title}</a></td>\n`
      + `    <td>${tags.join(',')}</td>\n`
      + '  </tr>\n';
  return content.slice(0, index) + information + content.slice(index);
}
