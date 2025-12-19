# Coolify Deployment Guide for Builder Stella

This guide explains how to deploy your application to Coolify with built-in environment variable validation.

---

## Current State

Your project is already configured for Coolify deployment with:
- ✅ Production-ready Dockerfile with multi-stage build
- ✅ Environment variable validation on startup
- ✅ Single `package.json` at root
- ✅ Unified build: `npm run build` builds both client and server
- ✅ Docker entrypoint script that fails fast if required env vars are missing

---

## Quick Deployment (Recommended)

**Pros**: Already configured, deploy in 5 minutes
**Cons**: Requires Supabase setup

### Step 1: Prepare Your Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or use an existing one
3. Get your credentials from **Settings > API**:
   - `SUPABASE_URL` (Project URL)
   - `SUPABASE_ANON_KEY` (anon/public key)

### Step 2: Push to Git Repository

```bash
git add .
git commit -m "Ready for Coolify deployment"
git push origin main
```

### Step 3: Deploy on Coolify

1. **Login to Coolify Dashboard**
2. **Create New Application**:
   - Click "New Resource" → "Application"
   - Select your Git repository (GitHub, GitLab, or Gitea)
   - Choose the branch to deploy (usually `main`)

3. **Configure Build Settings**:
   - **Build Pack**: Docker
   - **Dockerfile Location**: `./Dockerfile` (auto-detected)
   - **Port**: `3000`

4. **Set Required Environment Variables**:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   ```

5. **Optional Environment Variables**:
   ```env
   PORT=3000                    # Server port (default: 3000)
   RESEND_API_KEY=your_key      # For email notifications (optional)
   PING_MESSAGE=custom_message  # Custom ping message (optional)
   ```

6. **Deploy**: Click "Deploy" and wait for the build to complete

### What Happens During Deployment

1. **Build Stage**:
   - Installs all dependencies
   - Builds frontend (React SPA)
   - Builds backend (Express server)

2. **Production Stage**:
   - Creates minimal production image
   - Installs only production dependencies
   - Copies built assets

3. **Startup**:
   - ✅ Validates required environment variables
   - ❌ **Fails immediately** if `SUPABASE_URL` or `SUPABASE_ANON_KEY` are missing
   - ✅ Starts Express server serving both API and frontend

---

## Environment Variable Validation

The Docker container includes automatic environment variable validation. On startup, it will:

1. Check for required variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

2. If any are missing, the container will:
   - ❌ Display a clear error message
   - ❌ Exit with code 1
   - ❌ Prevent the application from starting in a broken state

3. If all are present, you'll see:
   ```
   🚀 Starting Fusion Starter application...
   🔍 Validating environment variables...
   ✅ All required environment variables are set
   📊 Configuration:
     - SUPABASE_URL: https://your-project.supabase.co
     - SUPABASE_ANON_KEY: [hidden]
     - PORT: 3000
     - NODE_ENV: production
   🎯 Starting server...
   🚀 Fusion Starter server running on port 3000
   ```

---

## Alternative: Monorepo Structure (Future Scaling)

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

### Required Variables

These **must** be set in Coolify, or the container will fail to start:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### Optional Variables

```env
PORT=3000                          # Server port (default: 3000)
NODE_ENV=production                # Node environment (default: production)
RESEND_API_KEY=re_your_key_here   # For email notifications via Resend
PING_MESSAGE=custom_message        # Custom message for /ping endpoint
```

---

## Post-Deployment Verification

After deploying to Coolify, test these endpoints:

### 1. Health Check
```bash
curl https://your-domain/health
```
Expected response:
```json
{
  "status": "ok",
  "supabaseUrl": "set",
  "supabaseKey": "set",
  "env": "production"
}
```

### 2. API Ping
```bash
curl https://your-domain/api/ping
```
Expected response:
```json
{
  "message": "ping"
}
```

### 3. Frontend
Visit `https://your-domain/` in your browser - the React SPA should load.

---

## Deployment Checklist

- [x] Dockerfile created and tested
- [x] Environment variable validation implemented
- [ ] Push code to Git repository
- [ ] Create Supabase project and get credentials
- [ ] Add application in Coolify dashboard
- [ ] Configure required environment variables
- [ ] Deploy and monitor logs
- [ ] Verify health endpoint
- [ ] Test API endpoints
- [ ] Confirm frontend loads
