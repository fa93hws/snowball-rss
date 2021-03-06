# syntax=docker/dockerfile:1
FROM node:16.13.1-alpine
RUN apk --no-cache update && apk add --no-cache git chromium && rm -rf /var/cache/apk/*
# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /snowball-rss
COPY . .
COPY WeiRuanYaHei.ttf /usr/share/fonts/win/weiruanyahei.ttf
RUN npm ci && npm run test
ENTRYPOINT ["node", "dist/snowball-rss.js"]
