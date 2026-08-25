import pymysql
import time
import os
import sys

def main():
	NAME = os.getenv("MARIADB_DATABASE")
	USER = os.getenv("MARIADB_USER")
	PASSWORD = os.getenv("MARIADB_PASSWORD")
	while 1:
		print("TESTING THE DB", file=sys.stderr)
		db = None
		try:
			db = pymysql.connect(host="db", user=USER, password=PASSWORD, db=NAME)
		except pymysql.OperationalError as e:
			...
		if (db):
			break
		print("FAILED TO DB RETRY IN 2 SECOND", file=sys.stderr)
		time.sleep(2)

if __name__ == "__main__":
	main()
