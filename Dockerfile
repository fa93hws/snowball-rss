# syntax=docker/dockerfile:1
FROM node:12.22.8-alpine
RUN apk add --no-cache git
WORKDIR /snowball-rss
COPY . .
RUN npm ci
CMD ["node", "dist/snowball-rss.js"]
