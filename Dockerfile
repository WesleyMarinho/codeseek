# Multi-stage build for CodeSeek application
# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci --only=production

# Copy frontend source code
COPY frontend/ ./

# Build frontend assets (if needed)
RUN npm run build || echo "No build script found, using static files"

# Stage 2: Backend application
FROM node:18-alpine AS backend

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    redis \
    curl

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm ci --only=production

# Copy backend source code
COPY backend/ ./

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/frontend /app/public

# Create uploads directory
RUN mkdir -p /app/uploads && chmod 755 /app/uploads

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S codeseek -u 1001 -G nodejs

# Change ownership of app directory
RUN chown -R codeseek:nodejs /app

# Switch to non-root user
USER codeseek

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"]