# Cookie Croquis

Cookie Croquis is a lightweight template for building modern web applications with **Next.js**, **TypeScript**, **TailwindCSS**, and pre-configured **shadcn/ui** and **Magic UI** components.

---

## Features

- **Next.js** for server-side rendering and static site generation.
- **TypeScript** and **ESLint** for type-safe and clean code.
- **TailwindCSS** with shadcn/ui for customizable UI components.
- **Magic UI** integration for enhanced design elements.
- **Husky** and **lint-staged** for pre-commit quality checks.

---

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/cookie-croquis.git
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

---

## Folder Overview

```plaintext
├── src/
│   ├── app/              # Application entry point
|   ├── components/       # Custom components
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utility functions
│   └── styles/           # TailwindCSS styles and global CSS
├── components.json       # shadcn/ui setup
├── tailwind.config.js    # TailwindCSS configuration
├── tsconfig.json         # TypeScript configuration
```

---

## Scripts

- `pnpm dev` - Start development server.
- `pnpm build` - Build production app.
- `pnpm start` - Start production server.
- `pnpm lint` - Lint project files.
- `pnpm format` - Format code with Prettier.
- `pnpm format:check` - Check code formatting with Prettier.

---

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.
