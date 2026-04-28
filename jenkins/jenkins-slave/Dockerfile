ARG TAG=alpine
FROM jenkins/inbound-agent:${TAG}
ARG TAG
LABEL org.opencontainers.image.title="Project-2" \
      org.opencontainers.image.description="Second project as part of DevOps learning in Limudej Hutz" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.authors="Yaroslav Domb <yaroslav.domb@google.com>" \
      org.opencontainers.image.created="2026-04-07T00:00:00Z" \
      org.opencontainers.image.base.name="jenkins/inbound-agent:${TAG}"

USER root

# install dependencies
RUN --mount=type=cache,target=/var/cache/apk \
    apk update && apk add \
    ca-certificates \
    iptables \
    sudo \
    docker \
    docker-cli-compose

RUN echo "jenkins ALL=(ALL) NOPASSWD: /usr/bin/dockerd" >> /etc/sudoers

RUN adduser jenkins docker

COPY --chmod=744 entrypoint.sh /usr/local/bin/entrypoint.sh

USER jenkins

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]