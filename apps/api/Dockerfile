# ═══════════════════════════════════════════════════════════
#  UPOSA API — Production Docker Image
# ═══════════════════════════════════════════════════════════

# ── Stage 1: Dependencies ─────────────────────────────────
FROM node:24-alpine AS deps
WORKDIR /app

# Install dependencies first for better layer caching.
# This package is an npm-workspace member: the lockfile lives at the repo root,
# not here, and the build context is apps/api — so there is no local lockfile for
# `npm ci` to use. Use `npm install`, which resolves from package.json directly.
COPY package.json package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force

# ── Stage 2: Builder ──────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* tsconfig.json ./
COPY src ./src
COPY scripts ./scripts

# Install all deps (including devDeps for typescript compilation).
# See the deps stage above for why this uses `npm install` rather than `npm ci`.
RUN npm install && npm cache clean --force

# Compile TypeScript
RUN npm run build

# ── Stage 3: Production ───────────────────────────────────
FROM node:24-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy compiled output and production dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

# Ensure uploads directory exists
RUN mkdir -p public/uploads && chown -R nodejs:nodejs public

USER nodejs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "dist/server.js"]
