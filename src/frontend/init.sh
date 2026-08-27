#!/bin/sh
set -e

if [ ! -f "secrets/server.key" ] || [ ! -f "secrets/server.crt" ] ; then
	echo "Error: Missing frontend server certificat or key" >&2 
	exit 1
fi

# copy ssl things
mkdir -p /etc/nginx/ssl/
cp secrets/* /etc/nginx/ssl/

# copy conf + site
cp nginx/nginx.conf /etc/nginx/
rm -rf /var/www/html/
mkdir -p /var/www/


apk add --no-cache nodejs npm
npm --prefix ./site install --legacy-peer-deps
npm --prefix ./site run build
cp -r site/dist /var/www/html/

mkdir -p /run/nginx

nginx -g "daemon off;"
