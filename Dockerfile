# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy lock file and package.json first
COPY pnpm-lock.yaml package.json ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy everything else
COPY . .

# Build client (SPA) and server
RUN npm run build:client && npm run build:server

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy lock file and package.json
COPY pnpm-lock.yaml package.json ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built output from builder stage
COPY --from=builder /app/dist ./dist

# Copy and set up the entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Health check for Coolify deployment
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/health || exit 1

# Expose port (default 3000 for Coolify)
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Start application with validation
CMD ["./docker-entrypoint.sh"]
