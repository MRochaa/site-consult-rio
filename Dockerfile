FROM node:20-alpine AS base

# ---------- build stage (deps + compile in one stage) ----------
# Merged deps and builder into a single stage because Coolify injects
# ARG declarations into every FROM stage, which breaks BuildKit's
# COPY --from=<named-stage> resolution.
FROM base AS builder

# Native build tools for better-sqlite3
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run db:init
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------- production stage ----------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# SQLite runtime dependencies
RUN apk add --no-cache sqlite

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create data directory for database
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/data ./data
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3

# Set permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Persistent database volume
VOLUME ["/app/data"]

CMD ["node", "server.js"]
