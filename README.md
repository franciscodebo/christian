# christian

A simple task manager built with [Astro](https://astro.build) and [Svelte](https://svelte.dev).
Tasks are saved in your browser's localStorage, so there's no backend.

Live at https://franciscodebo.github.io/christian/

## Development

```sh
npm install
npm run dev      # http://localhost:4321/christian/
npm run build    # outputs to dist/
```

Every push to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.
