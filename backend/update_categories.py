
import sqlite3
import os

db_path = "backend/ecommerce.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE products ADD COLUMN category TEXT DEFAULT 'cafes'")
        print("Column 'category' added successfully.")
    except sqlite3.OperationalError:
        print("Column 'category' already exists.")
    
    # Add some accessories
    accessories = [
        ('Molino Manual Slim', 'molino-manual', 'Molino de muelas cerámicas para una molienda precisa.', 45.0, 'accesorios'),
        ('Prensa Francesa Copper', 'prensa-francesa', 'Diseño elegante en cobre para un café con cuerpo.', 35.0, 'accesorios'),
        ('Balanza Digital Pro', 'balanza-digital', 'Precisión de 0.1g para el barista exigente.', 25.0, 'accesorios'),
        ('Tetera Cuello de Cisne', 'tetera-cuello-cisne', 'Control total sobre el flujo de agua.', 35.0, 'accesorios'),
        ('Filtros de Papel V60', 'filtros-v60', 'Paquete de 100 unidades para una extracción limpia.', 12.0, 'accesorios')
    ]
    
    import uuid
    for name, slug, desc, price, cat in accessories:
        new_id = str(uuid.uuid4())
        try:
            cursor.execute("INSERT INTO products (id, name, slug, description, base_price, category, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)", (new_id, name, slug, desc, price, cat))
        except:
            pass
            
    conn.commit()
    conn.close()
