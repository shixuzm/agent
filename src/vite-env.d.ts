interface ImportMetaEnv {
  readonly VITE_APP_MODE?: string;
  readonly VITE_DIRECT_LLM?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
