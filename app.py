from flask import (
    Flask,
    request,
    jsonify,
    render_template,
    redirect,
    session,
    url_for,
)
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
import os
import psycopg2
import psycopg2.extras
import json
from datetime import timedelta
from dotenv import load_dotenv
import pyotp
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from supabase import create_client   # 👈 SUPABASE

load_dotenv()

# -----------------------------
# CONFIGURACIÓN APP
# -----------------------------
PORT = int(os.environ.get("APP_PORT", 8080))

app = Flask(__name__)

UPLOAD_FOLDER = "static/uploads"  # (queda, pero ya no se usa para imágenes)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# -----------------------------
# CONFIG SUPABASE STORAGE
# -----------------------------
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
SUPABASE_BUCKET = os.environ.get("SUPABASE_BUCKET")

supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# ==========================================================
# CONTEXTO GLOBAL PARA TEMPLATES (PRODUCCIÓN)
# ==========================================================
@app.context_processor
def inject_global_context():
    return {
        "texts": {
            "site_title": "Hogar y Más",
            "site_name": "Hogar y Más",
            "footer_tagline": "Todo para tu hogar"
        }
    }

# =============================
# FILTRO JINJA — FORMATO PRECIO ARS
# =============================
@app.template_filter("price_ars")
def price_ars(value):
    try:
        return f"${int(value):,}".replace(",", ".")
    except:
        return "$0"

# -----------------------------
# CONFIG APP
# -----------------------------
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Sesiones seguras
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY") or os.urandom(32)
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = os.environ.get("FLASK_ENV") == "production"

# Rate limiting
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["2000 per day", "500 per hour"],
)
limiter.init_app(app)

# -----------------------------
# CONEXIÓN A BD
# -----------------------------
def get_db_connection():
    return psycopg2.connect(
        os.environ["DATABASE_URL"],
        sslmode="require"
    )


# -----------------------------
# TABLAS: STOCK + ADMIN_USERS
# -----------------------------
def create_admin_users_table():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            CREATE TABLE IF NOT EXISTS admin_users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(120) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                totp_secret TEXT NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        conn.commit()
        cur.close()
        conn.close()
        print("✔ Tabla admin_users OK")

    except Exception as error:
        print("❌ ERROR CREANDO TABLA admin_users:", error)


def create_stock_table():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            CREATE TABLE IF NOT EXISTS stock (
                id SERIAL PRIMARY KEY,
                seller_id INTEGER NOT NULL,
                title VARCHAR(255) NOT NULL,
                price INTEGER NOT NULL,
                category VARCHAR(50),
                stock INTEGER DEFAULT 0,
                sizes VARCHAR(100),
                color VARCHAR(50),
                description TEXT,
                images JSONB DEFAULT '[]'::jsonb,
                is_sold BOOLEAN DEFAULT FALSE,
                is_featured BOOLEAN DEFAULT FALSE,
                featured_until TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        conn.commit()
        cur.close()
        conn.close()
        print("✔ Tabla stock (ropa) OK")

    except Exception as error:
        print("❌ ERROR CREANDO TABLA stock:", error)


create_admin_users_table()
create_stock_table()


# Crear admin por defecto desde variables de entorno
def ensure_default_admin():
    username = os.environ.get("ADMIN_USERNAME")
    password = os.environ.get("ADMIN_PASSWORD")
    totp_secret = os.environ.get("ADMIN_TOTP_SECRET")

    if not username or not password:
        print("⚠ No se creó admin por defecto (faltan ADMIN_USERNAME/ADMIN_PASSWORD)")
        return

    if not totp_secret:
        totp_secret = pyotp.random_base32()
        print("⚠ ADMIN_TOTP_SECRET no definido, se generó uno nuevo:")
        print("   👉 TOTP SECRET (agregar a Google Authenticator):", totp_secret)

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT id FROM admin_users WHERE username = %s;", (username,))
        existing = cur.fetchone()
        if existing:
            print(f"ℹ Admin por defecto '{username}' ya existe (id={existing[0]})")
            cur.close()
            conn.close()
            return

        password_hash = generate_password_hash(password)

        cur.execute(
            """
            INSERT INTO admin_users (username, password_hash, totp_secret, is_active)
            VALUES (%s, %s, %s, TRUE);
            """,
            (username, password_hash, totp_secret),
        )

        conn.commit()
        cur.close()
        conn.close()
        print(f"✔ Admin por defecto creado: {username}")
        print("   👉 Asegurate de guardar el TOTP SECRET en .env")

    except Exception as error:
        print("❌ ERROR creando admin por defecto:", error)


ensure_default_admin()


# -----------------------------
# LIMPIAR DESTACADOS VENCIDOS
# -----------------------------
def remove_expired_featured():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # ✅ FIX: tabla correcta
        cur.execute("""
            UPDATE stock
            SET is_featured = FALSE, featured_until = NULL
            WHERE featured_until IS NOT NULL
            AND featured_until < NOW();
        """)

        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print("❌ Error limpiando destacados vencidos:", e)


# -----------------------------
# HELPERS
# -----------------------------
from flask import session, jsonify, redirect, url_for, request
import json


def clean_int(value, default=0):
    if value is None:
        return default
    s = str(value).strip()
    if not s:
        return default
    s = s.replace(".", "").replace(",", "")
    s = s.replace("ARS", "").replace("ars", "")
    s = s.replace("k", "000").replace("K", "000")
    try:
        return int(s)
    except:
        return default


def admin_protected():
    """
    Protege tanto vistas HTML como endpoints API.
    - Si NO está autenticado:
        * API  -> JSON + 401
        * HTML -> redirect al login
    - Si está autenticado:
        * devuelve None (y el endpoint sigue)
    """
    if not session.get("admin_authenticated"):
        if request.path.startswith("/api/"):
            return jsonify({
                "success": False,
                "error": "Unauthorized"
            }), 401
        return redirect(url_for("admin_login"))

    return None


def normalize_images_db(images_value):
    """
    images en JSONB a veces vuelve como list, a veces como str JSON,
    o None. Devolvemos siempre lista.
    """
    if images_value is None:
        return []
    if isinstance(images_value, list):
        return images_value
    if isinstance(images_value, str):
        t = images_value.strip()
        if not t:
            return []
        try:
            parsed = json.loads(t)
            if isinstance(parsed, list):
                return parsed
            if isinstance(parsed, dict):
                return list(parsed.values())
        except:
            return [images_value]
    if isinstance(images_value, dict):
        return list(images_value.values())
    return []

# -----------------------------
# RUTAS PÚBLICAS
# -----------------------------
@app.route("/")
def index():
    remove_expired_featured()
    return render_template("index.html")


# ==========================================================
# 📌 RUTAS LEGALES
# ==========================================================
@app.route("/terminos")
def terminos():
    return render_template("terminos.html")


@app.route("/privacidad")
def privacidad():
    return render_template("privacidad.html")


@app.route("/exencion")
def exencion():
    return render_template("exencion.html")

# ==========================================================
# 🔐 LOGIN ADMIN: USER/PASS + 2FA
# ==========================================================
@app.route("/admin_login", methods=["GET", "POST"])
@limiter.limit("5 per minute")
def admin_login():
    if request.method == "GET":
        if admin_protected():
            return redirect(url_for("admin_panel"))
        return render_template("admin_login.html")

    username = request.form.get("username", "").strip()
    password = request.form.get("password", "")

    if not username or not password:
        return render_template("admin_login.html", error="Usuario y contraseña son obligatorios")

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT id, password_hash
            FROM admin_users
            WHERE username = %s AND is_active = TRUE;
            """,
            (username,),
        )

        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            return render_template("admin_login.html", error="Usuario o contraseña incorrectos")

        user_id, password_hash = row

        if not check_password_hash(password_hash, password):
            return render_template("admin_login.html", error="Usuario o contraseña incorrectos")

        session.clear()
        session["admin_2fa_user_id"] = user_id
        session.permanent = True
        app.permanent_session_lifetime = timedelta(days=1)

        return redirect(url_for("admin_2fa"))

    except Exception as error:
        print("❌ Error en admin_login:", error)
        return render_template("admin_login.html", error="Error interno, intentá de nuevo más tarde")


@app.route("/admin_2fa", methods=["GET", "POST"])
@limiter.limit("5 per minute")
def admin_2fa():
    user_id = session.get("admin_2fa_user_id")
    if not user_id:
        return redirect(url_for("admin_login"))

    if request.method == "GET":
        return render_template("admin_2fa.html")

    code = request.form.get("code", "").strip()
    if not code:
        return render_template("admin_2fa.html", error="Ingresá el código 2FA")

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT totp_secret
            FROM admin_users
            WHERE id = %s AND is_active = TRUE;
            """,
            (user_id,),
        )

        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            session.clear()
            return redirect(url_for("admin_login"))

        totp_secret = row[0]
        totp = pyotp.TOTP(totp_secret)

        if not totp.verify(code, valid_window=1):
            return render_template("admin_2fa.html", error="Código 2FA inválido")

        session.clear()
        session["admin_authenticated"] = True
        session["admin_user_id"] = user_id
        session.permanent = True
        app.permanent_session_lifetime = timedelta(days=1)

        return redirect(url_for("admin_panel"))

    except Exception as error:
        print("❌ Error en admin_2fa:", error)
        session.clear()
        return redirect(url_for("admin_login"))


@app.route("/admin_logout")
def admin_logout():
    session.clear()
    return redirect(url_for("admin_login"))

@app.route("/admin_panel")
def admin_panel():
    if not admin_protected():
        return redirect(url_for("admin_login"))

    remove_expired_featured()

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
    SELECT id, name
    FROM categories
    ORDER BY name
""")

    categories = cur.fetchall()

    cur.close()
    conn.close()

    return render_template(
        "admin_panel.html",
        categories=categories
    )

# ==========================================================
# API: CREAR PRODUCTO (solo admin)
# ==========================================================
@app.route("/api/stock", methods=["POST"])
def add_stock():
    auth = admin_protected()   # 🔧 CAPTURAMOS EL RETURN
    if auth is not True:       # 🔧 SI NO ES TRUE, CORTAMOS
        return auth

    try:
        data = request.form

        # 🔥 BADGES
        badges = json.loads(data.get("badges", "[]"))

        # ---------- IMÁGENES ----------
        images_paths = []
        for i in range(1, 5):
            f = request.files.get(f"image{i}")
            if f and f.filename:
                filename = secure_filename(f.filename)
                path = f"products/{filename}"

                supabase.storage.from_(SUPABASE_BUCKET).upload(
                    path,
                    f.read(),
                    file_options={
                        "content-type": f.mimetype,
                        "upsert": True
                    }
                )

                public_url = supabase.storage.from_(SUPABASE_BUCKET).get_public_url(path)
                images_paths.append(public_url)

        # ---------- CAMPOS ----------
        title = (data.get("title") or "").strip()
        price = clean_int(data.get("price"), 0)

        gender = (data.get("gender") or "").strip()
        category_id = clean_int(data.get("category_id"), 0)

        stock_qty = clean_int(data.get("stock"), 0)
        sizes = (data.get("sizes") or "").strip()
        color = (data.get("color") or "").strip()
        description = (data.get("description") or "").strip()

        # ---------- VALIDACIONES ----------
        if not title or price <= 0:
            return jsonify({"success": False, "error": "Datos inválidos"}), 400

        if not gender or category_id <= 0:
            return jsonify({
                "success": False,
                "error": "Género y categoría son obligatorios"
            }), 400

        seller_id = 1

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO stock (
                seller_id, title, price, gender,
                category_id, stock, sizes,
                color, description, images
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s::jsonb)
            RETURNING id;
        """, (
            seller_id,
            title,
            price,
            gender,
            category_id,
            stock_qty,
            sizes,
            color,
            description,
            json.dumps(images_paths),
        ))

        new_id = cur.fetchone()[0]

        for badge_id in badges:
            cur.execute("""
                INSERT INTO stock_badges (stock_id, badge_id)
                VALUES (%s, %s)
            """, (new_id, int(badge_id)))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"success": True, "id": new_id})

    except Exception as e:
        print("❌ ERROR POST /api/stock:", e)
        return jsonify({"success": False, "error": str(e)}), 500

# ==========================================================
# API: CATEGORÍAS (admin + público)
# ==========================================================
@app.route("/api/categories")
def api_categories():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT id, name
            FROM categories
            ORDER BY name
        """)

        rows = cur.fetchall()

        cur.close()
        conn.close()

        return jsonify([
            {"id": r[0], "name": r[1]} for r in rows
        ])

    except Exception as e:
        print("❌ Error categories:", e)
        return jsonify([]), 500

# ==========================================================
# API: BADGES (admin)
# ==========================================================
@app.route("/api/badges")
def get_badges():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT id, name
            FROM badges
            ORDER BY id
        """)

        rows = cur.fetchall()
        cur.close()
        conn.close()

        return jsonify([
            {
                "id": r[0],
                "name": r[1]
            }
            for r in rows
        ])

    except Exception as e:
        print("❌ Error badges:", e)
        return jsonify([]), 500

# ==========================================================
# API: OBTENER STOCK (público) ✅ FIX GENDER
# ==========================================================
@app.route("/api/stock", methods=["GET"])
def get_stock():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT
                s.id,
                s.seller_id,
                s.title,
                s.price,
                s.gender,          -- ✅ CLAVE
                s.category_id,
                s.stock,
                s.sizes,
                s.color,
                s.description,
                s.images,
                s.is_sold,
                s.is_featured,
                s.featured_until,
                s.created_at,
                COALESCE(
                    json_agg(b.slug) FILTER (WHERE b.slug IS NOT NULL),
                    '[]'
                ) AS badges
            FROM stock s
            LEFT JOIN stock_badges sb ON sb.stock_id = s.id
            LEFT JOIN badges b ON b.id = sb.badge_id
            GROUP BY s.id
            ORDER BY s.created_at DESC
        """)

        rows = cur.fetchall()
        cur.close()
        conn.close()

        items = []
        for r in rows:
            items.append({
                "id": r[0],
                "seller_id": r[1],
                "title": r[2],
                "price": r[3],
                "gender": (r[4] or "").lower(),   # ✅ AHORA LLEGA
                "category_id": r[5],
                "stock": r[6],
                "sizes": r[7] or "",
                "color": r[8] or "",
                "description": r[9] or "",
                "images": normalize_images_db(r[10]),
                "is_sold": r[11],
                "is_featured": r[12],
                "featured_until": r[13].isoformat() if r[13] else None,
                "created_at": r[14].isoformat() if r[14] else None,
                "badges": r[15] or []
            })

        return jsonify({"items": items})

    except Exception as e:
        print("❌ ERROR GET /api/stock:", e)
        return jsonify({"success": False, "error": "mensaje"}), 400

# ==========================================================
# API: SOFT DELETE / EDIT / GET ITEM (solo admin) ✅ FIX FRONTEND
# ==========================================================
@app.route("/api/stock/<int:item_id>", methods=["GET", "PUT", "DELETE"])
def stock_item(item_id):
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # ======================
        # GET ITEM
        # ======================
        if request.method == "GET":
            cur.execute("""
                SELECT id, title, price, stock, sizes, color, description, images
                FROM stock
                WHERE id = %s
            """, (item_id,))

            row = cur.fetchone()
            if not row:
                return jsonify({"error": "Producto no encontrado"}), 404

            return jsonify({
                "id": row[0],
                "title": row[1],
                "price": row[2],
                "stock": row[3],
                "sizes": row[4],
                "color": row[5],
                "description": row[6],
                "images": normalize_images_db(row[7]),
            })

        # ======================
        # PUT (EDITAR)
        # ======================
        if request.method == "PUT":
            data = request.get_json(silent=True) or {}

            cur.execute("""
                UPDATE stock SET
                    title = %s,
                    price = %s,
                    stock = %s,
                    sizes = %s,
                    color = %s,
                    description = %s
                WHERE id = %s
            """, (
                (data.get("title") or "").strip(),
                clean_int(data.get("price"), 0),
                clean_int(data.get("stock"), 0),
                (data.get("sizes") or "").strip(),
                (data.get("color") or "").strip(),
                (data.get("description") or "").strip(),
                item_id
            ))

            conn.commit()
            return jsonify({"success": True})

        # ======================
        # DELETE
        # ======================
        if request.method == "DELETE":
            cur.execute("DELETE FROM stock WHERE id = %s", (item_id,))
            conn.commit()
            return jsonify({"success": True})

    except Exception as e:
        conn.rollback()
        print("❌ ERROR stock_item:", e)
        return jsonify({"error": "Error interno"}), 500

    finally:
        cur.close()
        conn.close()


# ==========================================================
# DESTACAR / QUITAR DESTACADO (solo admin)
# ==========================================================
@app.route("/feature/<int:item_id>", methods=["POST"])
def feature(item_id):
    if not admin_protected():
        return jsonify({"success": False, "error": "Unauthorized"}), 401

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        """
        UPDATE stock
        SET is_featured = TRUE,
            featured_until = NOW() + INTERVAL '24 HOURS'
        WHERE id = %s;
        """,
        (item_id,),
    )

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"success": True})


@app.route("/unfeature/<int:item_id>", methods=["POST"])
def unfeature(item_id):
    if not admin_protected():
        return jsonify({"success": False, "error": "Unauthorized"}), 401

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        """
        UPDATE stock
        SET is_featured = FALSE, featured_until = NULL
        WHERE id = %s;
        """,
        (item_id,),
    )

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"success": True})

# ==========================================================
# DETALLE (público) ✅ + BADGES + RELATED
# ==========================================================
@app.route("/stock/<int:item_id>")
def item_detail(item_id):
    remove_expired_featured()

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # =========================
        # ITEM PRINCIPAL
        # =========================
        cur.execute("""
            SELECT
                s.id,
                s.seller_id,
                s.title,
                s.price,
                s.category,
                s.stock,
                s.sizes,
                s.color,
                s.description,
                s.images,
                s.is_sold,
                s.is_featured,
                s.featured_until,
                s.created_at,
                COALESCE(
                    json_agg(b.slug) FILTER (WHERE b.slug IS NOT NULL),
                    '[]'
                ) AS badges
            FROM stock s
            LEFT JOIN stock_badges sb ON sb.stock_id = s.id
            LEFT JOIN badges b ON b.id = sb.badge_id
            WHERE s.id = %s
            GROUP BY s.id;
        """, (item_id,))

        row = cur.fetchone()

        if not row:
            cur.close()
            conn.close()
            return render_template("item_not_found.html", item_id=item_id)

        item = {
            "id": row[0],
            "seller_id": row[1],
            "title": row[2],
            "price": row[3],
            "category": row[4],
            "stock": row[5],
            "sizes": [s.strip() for s in (row[6] or "").split(",") if s.strip()],
            "color": row[7] or "",
            "description": row[8] or "",
            "images": normalize_images_db(row[9]),
            "is_sold": row[10],
            "is_featured": row[11],
            "featured_until": row[12],
            "created_at": row[13],
            "badges": row[14] or [],
        }

        # =========================
        # RELATED PRODUCTS
        # =========================
        cur.execute("""
            SELECT
                id,
                title,
                price,
                images
            FROM stock
            WHERE
                id != %s
                AND (
                    category = %s
                    OR %s IS NULL
                    OR category IS NULL
             )
            ORDER BY RANDOM()
            LIMIT 4;
        """, (item["id"], item["category"], item["category"]))


        related_rows = cur.fetchall()

        related_items = []
        for r in related_rows:
            related_items.append({
                "id": r[0],
                "title": r[1],
                "price": r[2],
                "images": normalize_images_db(r[3]),
            })

        cur.close()
        conn.close()

        return render_template(
            "item_detail.html",
            item=item,
            related_items=related_items
        )

    except Exception as error:
        print("❌ Error detalle:", error)
        return render_template("item_not_found.html", item_id=item_id)



# ==========================================================
# SERVER
# ==========================================================
if __name__ == "__main__":
    print(f"Backend listo en puerto {PORT}")
    app.run(debug=True, host="0.0.0.0", port=PORT)
