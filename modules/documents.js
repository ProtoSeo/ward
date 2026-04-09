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
