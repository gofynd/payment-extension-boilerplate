# Build frontend React app
FROM node:20-alpine as frontend-builder
WORKDIR /srv/frontend
COPY ./frontend/package.json ./frontend/package-lock.json ./
RUN npm install
COPY ./frontend ./
RUN npm run build

# Build backend Node.js app and integrate frontend build
FROM node:20-alpine as backend-builder
RUN apk update && apk upgrade && apk add --no-cache python3-dev make alpine-sdk gcc g++ git build-base openssh openssl bash
WORKDIR /srv/pgext
COPY ./package.json ./package-lock.json ./
RUN npm install
COPY . .
# Remove frontend and src from backend context
RUN rm -rf ./frontend ./src
# Copy frontend build output to backend build directory
COPY --from=frontend-builder /srv/frontend/build ./build
RUN npm cache clean --force && rm -rf .git

# Final runtime image
FROM node:20-alpine
COPY --from=backend-builder /srv/pgext /srv/pgext
WORKDIR /srv/pgext
ENTRYPOINT ["node", "index.js", "--env", "production"]
