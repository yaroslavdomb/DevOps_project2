#!/bin/bash
set -e
 
# Start Docker daemon in the background (DinD)
sudo dockerd \
    --host=unix:///var/run/docker.sock \
    --storage-driver=vfs \
    &
 
# Wait for Docker daemon to be ready
echo "Waiting for Docker daemon..."
timeout 30 sh -c 'until docker info > /dev/null 2>&1; do sleep 1; done'
echo "Docker daemon is up."
 
# Hand off to the official Jenkins inbound-agent entrypoint
exec /usr/local/bin/jenkins-agent "$@"