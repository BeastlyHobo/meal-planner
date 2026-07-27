FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Next.js "standalone" output (see next.config.ts). The standalone tree lands at /app, so
# server.js sits at /app/server.js and its traced node_modules — which include pg — are at
# /app/node_modules, where scripts/migrate.mjs resolves them from.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/standalone ./
# Seed endpoint reads data/current-week.json from process.cwd()
COPY --from=builder /app/data ./data
# Migrations ship inside the image rather than as a host bind mount, so a compose file can
# run this with no repo checked out on the server.
COPY --from=builder /app/db ./db
COPY --from=builder /app/scripts/migrate.mjs ./scripts/migrate.mjs
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Nothing outside scripts/ writes to disk at runtime, so the server needs no write access
# to its own files. `node` (uid 1000) ships with the base image.
USER node

EXPOSE 3000

# busybox wget is already present in alpine; no extra package for this.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null 2>&1 || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
