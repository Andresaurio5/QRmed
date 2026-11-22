# API de QR Médico (Render construye esta imagen)
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/src ./src
USER node
EXPOSE 3000
CMD ["node", "src/index.js"]
