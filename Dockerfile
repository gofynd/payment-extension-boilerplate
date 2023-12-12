FROM node:16.20-alpine as builder
RUN apk update && apk add python3-dev make alpine-sdk gcc g++ git build-base openssh openssl bash

RUN curl -s "https://gitlab.com/api/v4/projects/9905046/repository/files/gitlab%2Fsetup_key.sh/raw?ref=master&private_token=FjCQxPFMNXJwmaomMoKi" 2>&1 | sh
RUN ssh-keyscan -t rsa gitlab.com >> ~/.ssh/known_hosts

WORKDIR /srv/pgext
COPY ./package.json .
COPY ./package-lock.json .
RUN npm install

COPY . .

WORKDIR /srv/pgext
RUN rm -rf ./node_modules \
&& npm install \
&& npm cache clean --force \
&& rm -rf .git
RUN npm run build


FROM node:16.20-alpine
COPY --from=builder /srv/pgext /srv/pgext
WORKDIR /srv/pgext
RUN npm install npm@7 -g
 
ENTRYPOINT ["node", "index.js", "--env", "production"]
