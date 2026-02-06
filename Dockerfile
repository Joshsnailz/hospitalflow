# ============================================================
# Stage 1: builder — install deps and build all services + web
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /repo

# System deps needed for native Node addons (bcrypt, etc.)
RUN apk add --no-cache libc6-compat python3 make g++

# Copy dependency manifests first (better layer caching)
COPY package.json package-lock.json turbo.json tsconfig.json ./
COPY apps/auth-service/package.json apps/auth-service/
COPY apps/user-service/package.json apps/user-service/
COPY apps/rbac-service/package.json apps/rbac-service/
COPY apps/audit-service/package.json apps/audit-service/
COPY apps/patient-service/package.json apps/patient-service/
COPY apps/clinical-service/package.json apps/clinical-service/
COPY apps/hospital-service/package.json apps/hospital-service/
COPY apps/api-gateway/package.json apps/api-gateway/
COPY apps/web/package.json apps/web/
COPY packages/ packages/
COPY libs/ libs/

RUN npm ci

# Copy entrypoint and source code
COPY docker-entrypoint.sh ./
COPY apps/ apps/

# Build all NestJS backend services + API gateway via turbo
RUN npx turbo run build --filter='./apps/*-service' --filter='./apps/api-gateway'

# Build Next.js web app (NEXT_PUBLIC_ vars must be set at build time)
ARG NEXT_PUBLIC_API_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build --prefix apps/web

# Copy static assets into standalone output (required for standalone mode)
RUN cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static
RUN if [ -d apps/web/public ]; then cp -r apps/web/public apps/web/.next/standalone/apps/web/public; fi

# ============================================================
# Stage 2: runner — lightweight production image
# ============================================================
FROM node:20-alpine AS runner

WORKDIR /repo

RUN apk add --no-cache libc6-compat

# Copy the entire built workspace from builder
COPY --from=builder /repo /repo

EXPOSE 3000 3001 3002 3003 3004 3005 3006 3007 3100

CMD ["node", "dist/main"]
