# Build stage
FROM node:20-alpine as builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy lock file and package.json
COPY pnpm-lock.yaml package.json ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy entire project
COPY . .

# Build client (SPA) and server
RUN pnpm build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy lock file and package.json
COPY pnpm-lock.yaml package.json ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built output from builder stage
COPY --from=builder /app/dist ./dist

# Copy data directory if it exists
COPY data ./data 2>/dev/null || true

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Expose port (default 3000 for Coolify)
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Start application
CMD ["node", "dist/server/node-build.mjs"]
