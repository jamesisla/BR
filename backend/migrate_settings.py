
import sqlite3

def migrate():
    conn = sqlite3.connect('backend/ecommerce.db')
    cursor = conn.cursor()
    
    try:
        # Add hero_title
        cursor.execute("ALTER TABLE store_settings ADD COLUMN hero_title VARCHAR DEFAULT 'El Arte de la Pureza';")
        print("Añadida columna: hero_title")
    except Exception as e:
        print(f"Error o ya existe hero_title: {e}")

    try:
        # Add hero_subtitle
        cursor.execute("ALTER TABLE store_settings ADD COLUMN hero_subtitle VARCHAR DEFAULT 'Descubre nuestra selección artesanal única.';")
        print("Añadida columna: hero_subtitle")
    except Exception as e:
        print(f"Error o ya existe hero_subtitle: {e}")

    try:
        # Add hero_image_url
        cursor.execute("ALTER TABLE store_settings ADD COLUMN hero_image_url VARCHAR;")
        print("Añadida columna: hero_image_url")
    except Exception as e:
        print(f"Error o ya existe hero_image_url: {e}")
        
    conn.commit()
    conn.close()
    print("Migración completada.")

if __name__ == "__main__":
    migrate()
