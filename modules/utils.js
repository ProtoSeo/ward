export function displayElement(elementId) {
  if (elementId.includes("input")) {
    document.getElementById(elementId).style.display = 'block';
    return;
  }
  document.getElementById(elementId).hidden = false;
}

export function hideElement(elementId) {
  if (elementId.includes("input")) {
    document.getElementById(elementId).style.display = 'none';
    return;
  }
  document.getElementById(elementId).hidden = true;
}

export function stringToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  const binString = String.fromCodePoint(...bytes);
  return btoa(binString);
}
