FROM nginx:1.31.3-alpine3.24 AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf

FROM runtime AS fed-frontend
COPY build/ /usr/share/nginx/html/

FROM runtime AS fed-auth-frontend
COPY auth/build/ /usr/share/nginx/html/
