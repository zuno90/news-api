# development
FROM node:alpine as development
WORKDIR /usr/src/app/api
COPY ./news-api/package*.json .
RUN yarn
COPY ./news-api/ .
RUN yarn build

# ENTRYPOINT ["./mongo-init.sh"]

# production
FROM node:alpine as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app/api

COPY ./news-api/package*.json .

RUN yarn --only=production

COPY ./news-api/ .

COPY --from=development /urs/src/app/dist ./dist

# ENTRYPOINT ["./mongo-init.sh"]

# CMD ["node", "dist/apps/orders/main"]