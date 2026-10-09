FROM node:24-alpine
WORKDIR /app
COPY server.js scenario.txt ./
ENV PORT=3000
EXPOSE 3000
USER node
CMD ["node", "server.js"]
