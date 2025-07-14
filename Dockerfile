# 1. Base Image - Debian-based for better compatibility
FROM node:20-slim AS base

# 2. Dependencies Stage
FROM base AS deps
# Install dependencies needed to build sharp
RUN apt-get update && apt-get install -y build-essential libvips
WORKDIR /app
COPY package.json package-lock.json ./
# Install all dependencies from package-lock.json
RUN npm ci

# 3. Builder Stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate the Prisma Client
RUN npx prisma generate
# Build the Next.js application
RUN npm run build

# 4. Runner Stage (Production)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Install runtime dependencies for Prisma (openssl) and Sharp (libvips)
RUN apt-get update && apt-get install -y openssl libssl1.1 libvips && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
# No need to copy schema or .prisma folder if they are part of the standalone output

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]