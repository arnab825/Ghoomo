# Tailwind CSS v4 & Styling Engineering Rules

Always follow these rules when writing styling and components in this repository:

## 1. Palette & Theme Tokens
- Always use theme tokens instead of raw hex values:
  - Saffron primary: `*-saffron-500` (replaces `#ff9933`)
  - Saffron secondary: `*-saffron-600` (replaces `#ff5e36`)
  - Examples: `text-saffron-500`, `bg-saffron-500`, `border-saffron-500`, `ring-saffron-500`, `shadow-saffron-500/25`, `hover:bg-saffron-600`.

## 2. Tailwind v4 Gradient Syntax
- Never use legacy `bg-gradient-to-...`.
- Always use Tailwind v4 `bg-linear-to-...`:
  - `bg-linear-to-r`
  - `bg-linear-to-br`
  - `bg-linear-to-t`

## 3. Scale Classes Over Arbitrary Values
- Do not write arbitrary pixel brackets when standard scale classes exist:
  - Sizing: `min-h-100` (not `min-h-[400px]`), `h-125` (not `h-[500px]`), `min-h-55` (not `min-h-[220px]`), `min-h-50` (not `min-h-[200px]`).
  - Positioning & Z-Index: `top-16` (not `top-[64px]`), `z-400` (not `z-[400]`).

## 4. Modern Flexbox Utilities
- Always use `shrink-0` instead of `flex-shrink-0`.
- Always use `grow` instead of `flex-grow`.

## 5. Focus & Border Non-Conflict Pattern
- Do NOT combine `border-slate-800` with `focus:border-...` on the same input element as it triggers property collision warnings in Tailwind IntelliSense.
- Instead, use: `border border-slate-800 focus:outline-none focus:ring-1 focus:ring-saffron-500` (or `focus:ring-emerald-400`).
- Do not add redundant `focus-visible:border-transparent`.

## 6. Input Placeholders & Select Elements
- Input placeholder colors are defined globally in `src/styles/index.css`.
- Avoid adding redundant `placeholder-slate-500` alongside `text-white` or `text-slate-100` on input classes to prevent IntelliSense color property conflict warnings.
- Never add `placeholder-*` to `<select>` elements (select elements do not support placeholder pseudo-elements).

## 7. Paired Pseudo-Classes
- When specifying conflicting properties for states (e.g. cursor states), always pair explicit pseudo-classes:
  - Correct: `enabled:cursor-pointer disabled:cursor-not-allowed`
  - Avoid: `cursor-pointer disabled:cursor-not-allowed` (triggers unconditional conflict warning).
