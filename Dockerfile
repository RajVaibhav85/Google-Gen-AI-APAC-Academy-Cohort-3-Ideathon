# ==============================================================================
# Multi-stage Dockerfile for Cloud Run Deployment
# Project: Personal Gemini Journal (Cohort 3 Ideathon)
# Label: dev-tutorial=cloud-run-ai-challenge
# ==============================================================================

FROM node:20-slim AS builder

WORKDIR /app

# Install client dependencies and build React Vite frontend
COPY client/package*.json ./client/
RUN npm --prefix client ci

COPY client/ ./client/
RUN npm --prefix client run build

# Stage 2: Production Runtime
FROM node:20-slim

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Install server dependencies
COPY server/package*.json ./server/
RUN npm --prefix server ci --only=production

# Copy server code and client build artifacts
COPY server/ ./server/
COPY --from=builder /app/client/dist ./client/dist

# Expose standard Cloud Run port
EXPOSE 8080

# Start Express server which serves both API and React SPA
CMD ["node", "server/server.js"]
