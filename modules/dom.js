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

export function disabledButton(elementId) {
  const element = document.getElementById(elementId);
  if (element.tagName.toLowerCase() === 'button') {
    element.disabled = true;
  }
}
