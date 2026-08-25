#!/bin/sh
set -e
echo "linit est lent(cer)"
uv pip install --system -r requirement.txt

python wait_db.py

python manage.py makemigrations models


python manage.py migrate
python manage.py runserver 0.0.0.0:8000
#daphne -b 0.0.0.0 -p 8000 config.asgi:application
