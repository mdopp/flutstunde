FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ── Runtime ──
FROM node:22-alpine

LABEL org.opencontainers.image.source="https://github.com/mdopp/flutstunde"
LABEL org.opencontainers.image.title="Flutstunde"

WORKDIR /app

# Install runtime dependencies only
COPY package.json package-lock.json* ./
RUN npm ci --production

# Copy built assets
COPY --from=build /app/dist ./dist
COPY server.mjs .

ENV PORT=3000

# Health check — uses node, which is in the image
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/healthz').then(r=>{if(r.status!==200)process.exit(1)})"

EXPOSE 3000

CMD ["node", "server.mjs"]
