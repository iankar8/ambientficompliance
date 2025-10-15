FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package.json tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 5000

# Run the bridge
CMD ["node", "dist/executor-bridge.js"]
