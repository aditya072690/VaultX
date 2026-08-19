# Multi-stage production build for VaultX Express API
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Generate Prisma client and compile TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npx prisma generate
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5001

# Copy only production dependencies and artifacts
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production && npx prisma generate

COPY --from=builder /app/dist ./dist

# Create upload directory for fallback mode
RUN mkdir -p uploads && chown -R node:node /app

USER node

EXPOSE 5001

CMD ["node", "dist/index.js"]
