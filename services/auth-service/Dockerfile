FROM node:22-alpine AS builder

WORKDIR /workspace

COPY packages ./packages

RUN npm install tsc -g

WORKDIR /workspace/packages/logger
RUN npm install && npm run build

WORKDIR /workspace/packages/kafka-client
RUN npm install && npm run build

WORKDIR /workspace/packages/redis-client
RUN npm install && npm run build

WORKDIR /workspace

# Copy auth-service files
COPY services/auth-service ./services/auth-service

WORKDIR /workspace/services/auth-service
RUN npm install

RUN npm run build

# ------------------------------------------------------------

# Production stage
FROM node:22-alpine

WORKDIR /workspace

# Copy built assets from builder
COPY --from=builder /workspace/packages ./packages
COPY --from=builder /workspace/services/auth-service/dist ./services/auth-service/dist
COPY --from=builder /workspace/services/auth-service/package*.json ./services/auth-service/

WORKDIR /workspace/services/auth-service

ENV NODE_ENV=production
# ENV PORT=3001

RUN npm ci

EXPOSE 3001

CMD ["node", "dist/app.js"]
