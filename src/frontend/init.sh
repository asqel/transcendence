#!/bin/sh
set -e

if [ ! -f "secrets/server.key" ] || [ ! -f "secrets/server.crt" ]; then
    echo "Error: Missing frontend server certificat or key" >&2
    exit 1
fi

mkdir -p /etc/nginx/ssl/
cp secrets/* /etc/nginx/ssl/

MODE=${MODE:-prod}
echo "=== Starting frontend in $MODE mode ==="

# --- bloc "location /" qui change selon le mode ---
if [ "$MODE" = "dev" ]; then
    LOCATION_ROOT='location / {
            proxy_pass http://127.0.0.1:5173;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }'
else
    LOCATION_ROOT='location / {
            if (!-e \$request_filename) {
                rewrite ^(.*)$ /index.html break;
            }
        }'
fi

# --- génère le nginx.conf final ---
cat > /etc/nginx/nginx.conf <<NGINX_EOF
events {}
http {
    include mime.types;
    default_type application/octet-stream;
    server {
        listen 443 ssl;
        server_name localhost;
        ssl_certificate /etc/nginx/ssl/server.crt;
        ssl_certificate_key /etc/nginx/ssl/server.key;
        root /var/www/html;

        $LOCATION_ROOT
        location /api/ {
            proxy_pass https://10.18.170.78;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }
        location /ws/ {
            proxy_pass https://10.18.170.78;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }
        location /assets/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
NGINX_EOF

rm -rf /var/www/html
mkdir -p /var/www

if [ ! -d "site/dist" ]; then
    echo "Error: site/dist not found. Build locally first:" >&2
    echo "  cd ./src/frontend/site" >&2
    echo "  npm install" >&2
    echo "  npm run build" >&2
    exit 1
fi

cp -r site/dist /var/www/html
echo "Frontend ready. Serving from /var/www/html"

mkdir -p /run/nginx
nginx -g "daemon off;"