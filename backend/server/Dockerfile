# The chat backend's image: Node.js runs the TypeScript sources directly (type stripping), SQLite is built in. The base
# image is pinned by digest, and npm leaves no logs or cache behind, so the same sources build the same image.
FROM node:24-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund --no-update-notifier && rm -rf /root/.npm /tmp/*
COPY src ./src
ENV NODE_ENV=production DATA_DIR=/data PORT=8080
EXPOSE 8080
CMD ["node", "src/server.ts"]
