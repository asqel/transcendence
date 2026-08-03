#!/bin/sh
set -e
echo "linit est lancer"
pip install -r requirement.txt
python manage.py migrate


pip show django
pip show channels
pip show daphne
python manage.py runserver 0.0.0.0:8000
#daphne -b 0.0.0.0 -p 8000 config.asgi:application
