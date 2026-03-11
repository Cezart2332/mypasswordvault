# To pin to an immutable digest (recommended for production), run:
#   docker pull node:22-bookworm-slim
#   docker inspect node:22-bookworm-slim --format '{{index .RepoDigests 0}}'
# Then replace the tag below with the digest, e.g.:
#   FROM node@sha256:<digest>
FROM node:22-bookworm-slim AS build

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

WORKDIR /usr/src/app

COPY package*.json package-lock.json ./

RUN npm ci

COPY ./ ./

RUN npm run build

# To pin the nginx image:
#   docker pull nginx:stable-alpine
#   docker inspect nginx:stable-alpine --format '{{index .RepoDigests 0}}'
FROM nginx:stable-alpine as production


COPY --from=build /usr/src/app/nginx /etc/nginx/conf.d

COPY --from=build /usr/src/app/dist /usr/share/nginx/html