#!/bin/sh
set -e
echo "linit est lent(cer)"
pip install -r requirement.txt

apt update -y
apt install -y mariadb-server -y
until mysqladmin ping -h db -u${MARIADB_USER} -p${MARIADB_PASSWORD} ; do
	sleep 2
done

python manage.py migrate
python manage.py runserver 0.0.0.0:8000
#daphne -b 0.0.0.0 -p 8000 config.asgi:application
