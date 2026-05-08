# Pickline — Close Senior Frontend Engineer Assessment

A performant item-picker built with React 19 + TypeScript + Vite.

**Live demo:** https://close-frontend-assessment.vercel.app/

---

## Features

- **Search** — debounced (150 ms) full-text search across 800 items
- **Color filter** — multi-select color badge filters, combinable with search
- **Selection rail** — sidebar that persists your selection to `localStorage` across sessions
- **Clear all** — two-step confirmation before wiping the selection
- **Keyboard navigation** — full roving tabindex on the item grid (Arrow keys, Home/End, Space/Enter, `/` to jump to search, Escape to exit)
- **Accessible** — `listbox`/`option` ARIA roles, `aria-multiselectable`, `aria-live` result count, `:focus-visible` ring
- **Responsive** — stacked single-column on mobile (side rail collapses when empty), 2–4 column grid on desktop

## Stack

- React 19, TypeScript, Vite
- No UI library — all components and icons are hand-rolled CSS

## Local development

```bash
npm install
npm run dev
```

## JSFiddle submission

`jsfiddle.js` is a self-contained Babel + JSX version of the same app for the original challenge submission:

- **HTML panel** — load React 18 UMD scripts + `<div id="root">`
- **CSS panel** — paste `src/App.css`
- **JavaScript panel** — paste `jsfiddle.js`, preprocessor set to **Babel + JSX**
