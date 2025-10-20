FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm install
RUN npm install --workspace=server

# Copy source code
COPY server/ ./server/

# Build
RUN npm run build --workspace=server

EXPOSE 3001

CMD ["npm", "run", "start", "--workspace=server"]

