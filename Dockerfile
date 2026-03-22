FROM node:22-alpine

WORKDIR /app

# Copy workspace config first (layer caching)
COPY package.json yarn.lock turbo.json ./
COPY packages/types/package.json ./packages/types/
COPY apps/backend/package.json ./apps/backend/

# Install all workspace dependencies
RUN yarn install --frozen-lockfile --production=false

# Copy source
COPY packages/types ./packages/types
COPY apps/backend ./apps/backend

# Build backend (tsc)
RUN yarn workspace @property-agent/backend build

WORKDIR /app/apps/backend

EXPOSE 3001

CMD ["node", "dist/app.js"]
