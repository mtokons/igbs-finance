# IGBS Finance — production image (Next.js standalone + Prisma + SQLite)
FROM node:20-slim

WORKDIR /app

# OpenSSL is required by the Prisma query engine
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install all dependencies (dev deps needed for build + tsx seed)
COPY package*.json ./
RUN npm ci

# Copy source and build (build script also runs `prisma generate`)
COPY . .
RUN npx prisma generate && npx next build

ENV NODE_ENV=production
ENV PORT=3010
# SQLite database lives on a persistent volume mounted at /data
ENV DATABASE_URL="file:/data/prod.db"

VOLUME /data
EXPOSE 3010

# On boot: ensure schema exists, seed baseline data (idempotent), then start.
CMD ["sh", "-c", "npx prisma db push --skip-generate --accept-data-loss && npx tsx prisma/seed.ts && npx next start -p 3010"]
