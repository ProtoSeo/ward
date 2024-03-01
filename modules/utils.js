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

export function base64ToString(base64) {
  const binString = atob(base64);
  const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
  return new TextDecoder().decode(bytes);
}
