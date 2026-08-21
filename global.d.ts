// Ambient module declaration for side-effect CSS imports (e.g. `import "./globals.css"`).
// CSS files have no JS/TS exports to type — Next's build pipeline handles them,
// this just satisfies the TypeScript compiler.
declare module "*.css";
