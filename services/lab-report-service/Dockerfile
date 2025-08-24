FROM node:18-bullseye AS builder

# Install system dependencies for building
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    tesseract-ocr \
    tesseract-ocr-eng \
    poppler-utils \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# Copy and build packages in correct order
COPY packages ./packages

RUN npm install tsc -g

WORKDIR /workspace/packages/logger
RUN npm install && npm run build

WORKDIR /workspace/packages/kafka-client
RUN npm install && npm run build

WORKDIR /workspace/packages/redis-client
RUN npm install && npm run build

WORKDIR /workspace

# Copy lab-report-service files
COPY services/lab-report-service ./services/lab-report-service

WORKDIR /workspace/services/lab-report-service

# Install Node.js dependencies
RUN npm install

# Install Python dependencies
RUN pip3 install -r python/requirements.txt

# Build TypeScript
RUN npm run build

# ------------------------------------------------------------

# Production stage
FROM node:18-bullseye

# Install system dependencies for production
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    tesseract-ocr \
    tesseract-ocr-eng \
    poppler-utils \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# Copy built assets from builder
COPY --from=builder /workspace/packages ./packages
COPY --from=builder /workspace/services/lab-report-service/dist ./services/lab-report-service/dist
COPY --from=builder /workspace/services/lab-report-service/package*.json ./services/lab-report-service/
COPY --from=builder /workspace/services/lab-report-service/python ./services/lab-report-service/python

WORKDIR /workspace/services/lab-report-service

# Install Python dependencies in production
RUN pip3 install -r python/requirements.txt

# Set production environment
ENV NODE_ENV=production

# Install only production Node.js dependencies
RUN npm ci --only=production

# Create uploads directory with proper permissions
RUN mkdir -p uploads && chmod 755 uploads

# Expose port
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3004/api/v1/labReport/health || exit 1

# Run the compiled JavaScript
CMD ["node", "dist/app.js"]
