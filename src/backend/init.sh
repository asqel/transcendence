#!/bin/sh
set -e
echo "linit est lancer"
pip install -r requirement.txt
python manage.py migrate

python manage.py runserver 0.0.0.0:8000
