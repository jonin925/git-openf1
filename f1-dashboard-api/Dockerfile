# Multi-stage build for production optimization
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install PostgreSQL client for healthchecks
RUN apk add --no-cache postgresql-client curl

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create logs directory
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app/logs

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 3001 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Start application
CMD ["node", "dist/app.js"]