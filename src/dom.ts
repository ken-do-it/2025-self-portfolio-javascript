export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag); node.className = cls; node.textContent = text; return node;
}
export function button(text: string, action: () => void, cls = ''): HTMLButtonElement {
  const b = el('button', cls, text); b.type = 'button'; b.addEventListener('click', action); return b;
}
export function label(text: string, control: HTMLElement) { const l = el('label', 'field'); l.append(el('span', 'sr-only', text), control); return l; }
