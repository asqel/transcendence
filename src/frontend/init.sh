#!/bin/sh
set -e

if [ ! -f "secrets/server.key" ] || [ ! -f "secrets/server.crt" ]; then
    echo "Error: Missing frontend server certificat or key" >&2
    exit 1
fi

mkdir -p /etc/nginx/ssl/
cp secrets/* /etc/nginx/ssl/
cp nginx/nginx.conf /etc/nginx/nginx.conf 

rm -rf /var/www/html
mkdir -p /var/www
apk add --no-cache nodejs npm
cp ./site /site-react/ -r

npm --prefix /site-react install --legacy-peer-deps
npm --prefix /site-react run build
cp -r /site-react/dist /var/www/html

mkdir -p /run/nginx
nginx -g "daemon off;"