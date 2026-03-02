FROM node:22-slim

# Install build deps for native modules like better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all deps
RUN npm ci --ignore-scripts=false

# Copy the rest of the source
COPY . .

# Expose the port
EXPOSE 3001

# Start the server
CMD ["npx", "tsx", "server.ts"]
