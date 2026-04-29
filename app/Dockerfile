FROM nginx:alpine

LABEL org.opencontainers.image.title="Project-2" \
      org.opencontainers.image.description="Second project as part of DevOps learning in Limudej Hutz" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.authors="Yaroslav Domb <yaroslav.domb@google.com>" \
      org.opencontainers.image.created="2026-04-29T00:00:00Z" \
      org.opencontainers.image.base.name="nginx:alpine"

COPY ./src /usr/share/nginx/html

EXPOSE 80