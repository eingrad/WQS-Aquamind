# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────
# Stage 1 — build: install deps, generate Prisma client, compile TS
# ─────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# Don't let the puppeteer npm package download its own Chromium —
# we install the system Chromium in the runtime stage instead.
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package*.json ./
RUN npm ci

# Generate the Prisma client (writes into node_modules/.prisma)
COPY prisma ./prisma
RUN npx prisma generate

# Compile TypeScript -> dist/
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ─────────────────────────────────────────────────────────────
# Stage 2 — runtime: slim image + Chromium + compiled app
# ─────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Chromium for PDF report generation + openssl/ca-certificates for Prisma
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        chromium \
        ca-certificates \
        openssl \
        fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# App code + deps (node_modules already has the generated Prisma client)
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma
COPY reports ./reports
COPY docker-entrypoint.sh ./

# Regenerate Prisma client for this runtime's exact OpenSSL version
RUN npx prisma generate

# Normalise line endings (in case the repo was checked out on Windows) + make executable
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

EXPOSE 5001
ENTRYPOINT ["./docker-entrypoint.sh"]
