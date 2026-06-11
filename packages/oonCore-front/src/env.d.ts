/**
 * Ambiente mínimo de `import.meta.env` sem depender dos tipos do Vite — o
 * pacote é uma lib e não deve carregar `vite/client`. A Central consumidora
 * (que usa Vite) tem os tipos completos.
 */
interface ImportMetaEnv {
  readonly PROD?: boolean;
  readonly DEV?: boolean;
  readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env?: ImportMetaEnv;
}
