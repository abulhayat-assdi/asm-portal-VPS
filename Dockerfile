# Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set necessary env vars for build time
ENV NEXT_TELEMETRY_DISABLED=1
ENV PRISMA_CLIENT_ENGINE_TYPE=library
# Use a dummy DB URL during build to satisfy Prisma validation
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

RUN npx prisma generate
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PRISMA_CLIENT_ENGINE_TYPE=library

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Explicitly copy the generated prisma client and engines
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

RUN npm install -g prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Sync schema to DB (db push works for fresh and existing DBs without migration files)
# Then start the app
CMD ["sh", "-c", "prisma db push --accept-data-loss && node server.js"]
