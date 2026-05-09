
import sqlite3
import json

conn = sqlite3.connect("backend/tienda.db")
conn.row_factory = sqlite3.Row
cursor = conn.cursor()
cursor.execute("SELECT * FROM products")
rows = [dict(row) for row in cursor.fetchall()]
print(json.dumps(rows, indent=2))
conn.close()
