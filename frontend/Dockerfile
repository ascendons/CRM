FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production deps
RUN npm ci --omit=dev

# Copy only runtime files (NOT full source build process)
COPY . .

# Ensure env
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/ping || exit 1

# Start app (expects prebuilt .next)
CMD ["npm", "start"]