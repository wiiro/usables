# Backend (Medusa v2). NÃO TESTADO: o Docker não está instalado na máquina de desenvolvimento.
# Antes de usar em produção: construir, rodar e validar (ver ../docs/DEPLOY.md).
# Requisitos do Medusa em produção: PostgreSQL e Redis (ver DEPLOY.md, seção Redis).
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json turbo.json ./
COPY apps/backend/package.json apps/backend/
RUN npm ci
COPY apps ./apps
# `medusa build` gera apps/backend/.medusa/server (API + painel admin compilados).
RUN cd apps/backend && npx medusa build

FROM node:22-alpine AS run
ENV NODE_ENV=production MEDUSA_DISABLE_TELEMETRY=1
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/apps/backend/.medusa/server ./
RUN npm install --omit=dev && chown -R app:app /app
# Variáveis obrigatórias: DATABASE_URL, JWT_SECRET, COOKIE_SECRET, STORE_CORS, ADMIN_CORS, AUTH_CORS.
USER app
EXPOSE 9000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qO- http://127.0.0.1:9000/health >/dev/null || exit 1
# Migrações antes de subir (idempotente). Em produção, prefira rodá-las como etapa separada do deploy.
CMD ["sh", "-c", "npx medusa db:migrate && npx medusa start"]
