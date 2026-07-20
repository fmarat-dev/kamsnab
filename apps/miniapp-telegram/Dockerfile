# Собирается из корня монорепо: docker build -f apps/miniapp-telegram/Dockerfile .
# (см. infra/docker-compose.yml, context: ..)

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/site/package.json apps/site/package.json
COPY apps/miniapp-telegram/package.json apps/miniapp-telegram/package.json
COPY apps/miniapp-max/package.json apps/miniapp-max/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/api-client/package.json packages/api-client/package.json
COPY cms/package.json cms/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
ARG VITE_DIRECTUS_URL
ARG VITE_MANAGER_TELEGRAM_USERNAME
ENV VITE_DIRECTUS_URL=${VITE_DIRECTUS_URL}
ENV VITE_MANAGER_TELEGRAM_USERNAME=${VITE_MANAGER_TELEGRAM_USERNAME}
RUN pnpm --filter @kamsnab/miniapp-telegram build

FROM nginx:1.27-alpine AS runner
COPY --from=build /app/apps/miniapp-telegram/dist /usr/share/nginx/html
COPY apps/miniapp-telegram/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
