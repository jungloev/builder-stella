# Coolify Deployment Guide for Builder Stella

This document outlines two approaches to deploy your monorepo on Coolify. Choose **Setup A** for speed or **Setup B** for scalability.

---

## Current State

Your project currently has:
- Single `package.json` at root
- `client/`, `server/`, `shared/` directories
- Unified build: `pnpm build` builds both client and server
- Single start command: `pnpm start` runs the Express server with SPA frontend

---

## Setup A: Quick Deployment (Recommended for Now)

**Pros**: Minimal changes, deploy in 10 minutes  
**Cons**: Less ideal for multi-service scaling later

### Step 1: Update Server to Respect PORT Environment Variable

Edit [server/index.ts](server/index.ts) and find where the server starts (near the end of the file):

```typescript
// Find this line or add it at the end:
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, "::", () => {
  console.log(`Server listening on port ${PORT}`);
});
```

### Step 2: Create Root `.env.example`

```bash
# At project root, create .env.example
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
RESEND_API_KEY=your_resend_key_here
NODE_ENV=production
PORT=3000
```

### Step 3: Create Root Dockerfile

Create `Dockerfile` at project root:

```dockerfile
FROM node:20-alpine as builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy lock and manifest
COPY pnpm-lock.yaml package.json ./

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy entire project
COPY . .

# Build client and server
RUN pnpm build

# Production stage
FROM node:20-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy lock and manifest
COPY pnpm-lock.yaml package.json ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built output
COPY --from=builder /app/dist ./dist

# Copy data files if needed
COPY data ./data

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/server/node-build.mjs"]
```

### Step 4: Update `.gitignore` (if needed)

Ensure these are in `.gitignore`:
```
node_modules
dist
.env
.env.local
.env.*.local
```

### Step 5: Deploy on Coolify

1. **Push to Git**: Push your repository to GitHub, GitLab, or Gitea
2. **Add to Coolify**:
   - Login to Coolify dashboard
   - Click "New Application"
   - Select your Git repository
   - Choose "Docker" as deployment method
   - Configure:
     - **Build command**: `docker build -t myapp .`
     - **Ports**: Map `3000` to `3000`
     - **Environment Variables**: Add from `.env.example`
   - Deploy

---

## Setup B: Proper Monorepo Structure

**Pros**: Better organization, easier to scale to multiple services  
**Cons**: Requires restructuring

### Step 1: Create Monorepo Structure

```bash
# Create workspace directories
mkdir -p apps/client apps/server packages/shared

# Move files
mv client/* apps/client/
mv server/* apps/server/
mv shared/* packages/shared/

# Remove old directories
rmdir client server shared
```

### Step 2: Create `pnpm-workspace.yaml`

At project root:

```yaml
packages:
  - 'apps/client'
  - 'apps/server'
  - 'packages/shared'
```

### Step 3: Update Root `package.json`

Replace the root `package.json` with this structure:

```json
{
  "name": "builder-stella",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "pnpm run -r build",
    "build:client": "pnpm --filter @builder-stella/client build",
    "build:server": "pnpm --filter @builder-stella/server build",
    "start": "pnpm --filter @builder-stella/server start",
    "test": "pnpm run -r test",
    "format.fix": "pnpm run -r format.fix",
    "typecheck": "pnpm run -r typecheck"
  },
  "dependencies": {},
  "devDependencies": {}
}
```

### Step 4: Create `apps/client/package.json`

```json
{
  "name": "@builder-stella/client",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest --run",
    "typecheck": "tsc",
    "format.fix": "prettier --write ."
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.20.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react-swc": "^3.5.0",
    "vite": "^5.0.8"
  }
}
```

### Step 5: Create `apps/server/package.json`

```json
{
  "name": "@builder-stella/server",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "vite build --config vite.config.server.ts",
    "start": "node dist/server/node-build.mjs",
    "test": "vitest --run",
    "typecheck": "tsc",
    "format.fix": "prettier --write ."
  },
  "dependencies": {
    "@builder-stella/shared": "workspace:*",
    "express": "^5.1.0",
    "dotenv": "^17.2.1"
  },
  "devDependencies": {
    "vite": "^5.0.8"
  }
}
```

### Step 6: Create `packages/shared/package.json`

```json
{
  "name": "@builder-stella/shared",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "typecheck": "tsc"
  }
}
```

### Step 7: Update Path Aliases

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["../../packages/shared/*"],
      "@/*": ["../../apps/client/*"]
    }
  }
}
```

Update `vite.config.ts`:

```typescript
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./apps/client"),
    "@shared": path.resolve(__dirname, "./packages/shared"),
  },
}
```

### Step 8: Install Dependencies

```bash
pnpm install
```

### Step 9: Create Monorepo Dockerfile

```dockerfile
FROM node:20-alpine as builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

COPY apps/client ./apps/client
COPY apps/server ./apps/server
COPY packages/shared ./packages/shared

RUN pnpm install --frozen-lockfile

RUN pnpm build

FROM node:20-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/packages/shared ./packages/shared

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/server/node-build.mjs"]
```

### Step 10: Deploy on Coolify

Same as Setup A, but ensure the workspace is recognized by Coolify.

---

## Quick Decision Matrix

| Requirement | Setup A | Setup B |
|---|---|---|
| **Speed to Deploy** | ✅ 10 mins | ❌ 30 mins |
| **Add 2nd Service Later** | ⚠️ Refactor needed | ✅ Easy |
| **Team Scalability** | ⚠️ Medium | ✅ Better |
| **Simplicity** | ✅ High | ⚠️ Medium |

---

## Troubleshooting

### Build Fails on Coolify

**Issue**: Docker build fails  
**Solution**:
1. Ensure `pnpm-lock.yaml` is committed to git
2. Check NODE_ENV is set to `production`
3. Verify all environment variables in Coolify dashboard

### Port Already in Use

**Issue**: Container crashes, port error  
**Solution**:
1. Ensure Coolify has port `3000` available
2. Or update Dockerfile `EXPOSE` to a different port and map accordingly

### Environment Variables Not Found

**Issue**: Server crashes, missing SUPABASE_URL, etc.  
**Solution**:
1. In Coolify dashboard, add all variables from `.env.example`
2. Restart the application

### Build Size Too Large

**Issue**: Build takes too long or fails  
**Solution**:
1. Use `.dockerignore`:
   ```
   node_modules
   dist
   .git
   .github
   ```

---

## Environment Variables Reference

Create these in Coolify dashboard:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key

# Email
RESEND_API_KEY=your_resend_key

# Server
NODE_ENV=production
PORT=3000
```

---

## Post-Deployment Checks

After deploying to Coolify, verify:

1. **Health endpoint**: `https://your-domain/health`
   - Should return `{ "status": "ok" }`

2. **API endpoint**: `https://your-domain/api/ping`
   - Should return ping response

3. **Frontend loads**: Visit `https://your-domain/`
   - React app should load

---

## Next Steps

- [ ] Choose Setup A or B
- [ ] Follow steps 1-5 (A) or 1-10 (B)
- [ ] Create Dockerfile
- [ ] Push to Git
- [ ] Add to Coolify
- [ ] Configure environment variables
- [ ] Deploy
- [ ] Verify endpoints
