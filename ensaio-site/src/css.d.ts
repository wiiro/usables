// TypeScript 6 exige declaracao para imports de CSS (side-effect).
declare module "*.css";
// Next.js resolve "server-only" internamente (sem pacote instalado).
declare module "server-only";
