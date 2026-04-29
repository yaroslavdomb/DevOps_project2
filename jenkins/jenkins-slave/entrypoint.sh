#!/bin/bash
set -e
 
# Start Docker daemon in the background (DinD)
sudo dockerd \
    --host=unix:///var/run/docker.sock \
    --storage-driver=vfs \
    --ipv6=false \
    &
 
# Wait for Docker daemon to be ready
echo "Waiting for Docker daemon..."
timeout 30 sh -c 'until docker info > /dev/null 2>&1; do sleep 1; done'
echo "Docker daemon is up."

# My own issue - docker not works with IPv6, so I enforce it to use IPv4
export JAVA_OPTS="-Djava.net.preferIPv4Stack=true"
 
# Hand off to the official Jenkins inbound-agent entrypoint
exec /usr/local/bin/jenkins-agent "$@"