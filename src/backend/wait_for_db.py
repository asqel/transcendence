import pymysql
import time
import os

while True:
    try:
        pymysql.connect(
            host="db",
            user=os.environ["MARIADB_USER"],
            password=os.environ["MARIADB_PASSWORD"],
        )
        break
    except pymysql.err.OperationalError:
        print("En attente de la base de données...")
        time.sleep(2)