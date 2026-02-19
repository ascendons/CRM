# Simple Next.js Dockerfile for Elastic Beanstalk
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --prefer-offline

# Copy application code
COPY . .

# Accept build arguments for Next.js public env vars
ARG NEXT_PUBLIC_API_URL=https://api.ascendons.com/api/v1
ARG NEXT_PUBLIC_APP_URL=https://crm.ascendons.com

# Set environment variables for build time
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Build the application (env vars are embedded here)
RUN npm run build:prod

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/ping || exit 1

# Start the application
CMD ["npm", "start"]
