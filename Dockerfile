# ---- Base Node ----
FROM node:20-alpine AS base
# Preparing
RUN mkdir -p /var/app && chown -R node /var/app
# Set working directory
WORKDIR /var/app
# Copy project file
COPY . .

ENV NODE_ENV=production
RUN apk add --update bash curl git && rm -rf /var/cache/apk/*
RUN git config --global user.name "Anton Nemtsev"
RUN git config --global user.email "newsilentimp@gmail.com"
RUN npm ci --only=prod --silent
EXPOSE 3000
HEALTHCHECK --interval=5m --timeout=5s --retries=3 \
  CMD curl -f http://127.0.0.1:3000/healthcheck || exit 1
CMD node server.js
