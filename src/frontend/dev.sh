#!/bin/sh
set -e

if [ ! -f "secrets/server.key" ] || [ ! -f "secrets/server.crt" ]; then
    echo "Error: Missing frontend server certificat or key" >&2
    exit 1
fi

mkdir -p /etc/nginx/ssl/
cp secrets/* /etc/nginx/ssl/
cp nginx/nginx-dev.conf /etc/nginx/nginx.conf

apk add --no-cache nodejs npm
npm --prefix ./site install --legacy-peer-deps

npm --prefix ./site run dev -- --host 0.0.0.0 --port 5173 &

mkdir -p /run/nginx
nginx -g "daemon off;"