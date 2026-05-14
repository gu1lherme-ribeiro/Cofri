import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
config({ path: resolve(here, "../../.env") });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: resolve(here, "../.."),
  // Permite imports diretos de workspace packages que ainda estão como TS.
  transpilePackages: ["@cofri/auth", "@cofri/crypto", "@cofri/db"],
  // @prisma/client carrega o engine nativo (.so) em runtime via require
  // dinâmico. Se o Next tenta empacotar, o engine não vai junto e o
  // function quebra com "Query Engine for runtime rhel-openssl-3.0.x".
  // Externalizar mantém o pacote no node_modules em runtime.
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  // O tracing automático do Next não segue o require dinâmico que o
  // Prisma faz pra carregar o engine, então o .so.node não acompanha
  // o bundle. Aqui copia explicitamente o diretório do client gerado
  // (que inclui o engine `rhel-openssl-3.0.x`) pra todos os functions.
  outputFileTracingIncludes: {
    "*": [
      "../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/**/*",
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
};

export default nextConfig;
