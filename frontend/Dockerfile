# Stage 0, "build-stage", based on Node.js, to build and compile the frontend
FROM node:20 AS build-stage

WORKDIR /app

COPY package*.json /app/

# npm install 후 node_modules 정리 및 재설치로 rollup 문제 해결
RUN npm install
RUN rm -rf node_modules package-lock.json
RUN npm install

COPY ./ /app/

ARG VITE_API_URL=${VITE_API_URL}
ARG VITE_ENVIRONMENT=${VITE_ENVIRONMENT}

RUN npm run build


# Stage 1, based on Nginx, to have only the compiled app, ready for production with Nginx
FROM nginx:1

COPY --from=build-stage /app/dist/ /usr/share/nginx/html

COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY ./nginx-backend-not-found.conf /etc/nginx/extra-conf.d/backend-not-found.conf
