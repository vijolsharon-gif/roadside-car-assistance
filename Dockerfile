# Production Multi-Stage Dockerfile for RoadRescue
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for both client and server
COPY package.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/

RUN cd client && npm install --legacy-peer-deps
RUN cd server && npm install --save sql.js --ignore-scripts

COPY shared/ ./shared/
COPY client/ ./client/
COPY server/ ./server/

# Build React client bundle
RUN cd client && npm run build

# Seed database with initial fleet data
RUN cd server && node db/seed.js

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "server/index.js"]
