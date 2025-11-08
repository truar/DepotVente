FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./

###################
# PRUNED STAGE - Install dependencies
###################
FROM base AS pruned

# Copy all package.json files
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/database/package.json ./packages/database/

# Install all dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts

# Copy database package source and generate Prisma client
COPY packages/database ./packages/database
RUN pnpm --filter database db:generate

###################
# BACKEND DEV
###################
FROM pruned AS backend-dev

# Copy backend source
COPY apps/backend ./apps/backend

EXPOSE 3000

CMD ["pnpm", "--filter", "backend", "dev"]

###################
# BACKEND PROD
###################
FROM pruned AS backend-build

# Copy backend source
COPY apps/backend ./apps/backend

# Build backend
RUN pnpm --filter backend build

FROM base AS backend-prod

# Copy installed dependencies
COPY --from=pruned /app/node_modules ./node_modules
COPY --from=pruned /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=pruned /app/packages/database ./packages/database

# Copy built backend
COPY --from=backend-build /app/apps/backend/dist ./apps/backend/dist
COPY --from=backend-build /app/apps/backend/package.json ./apps/backend/

EXPOSE 3000

CMD ["node", "apps/backend/dist/index.js"]

###################
# FRONTEND DEV
###################
FROM pruned AS frontend-dev

# Copy frontend source
COPY apps/frontend ./apps/frontend

EXPOSE 5173

CMD ["pnpm", "--filter", "frontend", "dev"]

###################
# FRONTEND PROD
###################
FROM pruned AS frontend-build

# Copy frontend source
COPY apps/frontend ./apps/frontend

# Build frontend
RUN pnpm --filter frontend build

FROM nginx:alpine AS frontend-prod

# Copy built frontend
COPY --from=frontend-build /app/apps/frontend/dist /usr/share/nginx/html

# Copy nginx config
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
