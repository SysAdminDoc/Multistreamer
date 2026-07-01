FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8765
ENV GUN_FILE=/app/data

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js ./

EXPOSE 8765
VOLUME ["/app/data"]
CMD ["node", "server.js"]
