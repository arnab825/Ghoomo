<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Ghoomo Tailwind CSS v4 & Styling Standards

1. **Colors & Tokens**: Always use theme tokens `*-saffron-500` and `*-saffron-600` instead of `#ff9933` / `#ff5e36`.
2. **Gradients**: Use Tailwind v4 `bg-linear-to-...` (`bg-linear-to-r`, `bg-linear-to-br`, `bg-linear-to-t`), never `bg-gradient-to-...`.
3. **Scale Units**: Use standard scale classes instead of arbitrary pixel values (`min-h-100`, `h-125`, `min-h-55`, `top-16`, `z-400`).
4. **Flexbox**: Use `shrink-0` instead of `flex-shrink-0`.
5. **Focus States**: Do NOT combine `border-slate-800` with `focus:border-...`. Instead use `border border-slate-800 focus:outline-none focus:ring-1 focus:ring-saffron-500` to avoid CSS property collision warnings.
6. **Input Placeholders**: Input placeholders are styled globally in `index.css`. Do not add `placeholder-*` classes alongside `text-*` on input elements, and never put `placeholder-*` on `<select>` elements.
7. **Paired Pseudo-Classes**: Always pair contrasting state classes with their respective pseudo-classes (e.g. `enabled:cursor-pointer disabled:cursor-not-allowed`).

