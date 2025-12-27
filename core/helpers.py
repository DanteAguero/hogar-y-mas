import json

# ==========================================================
# HELPERS GENERALES — PRODUCCIÓN
# ==========================================================

def clean_int(value, default=0):
    if value is None:
        return default

    s = str(value).strip()
    if not s:
        return default

    s = (
        s.replace(".", "")
         .replace(",", "")
         .replace("ARS", "")
         .replace("ars", "")
         .replace("k", "000")
         .replace("K", "000")
    )

    try:
        return int(s)
    except:
        return default


def normalize_images_db(images_value):
    """
    Convierte images de DB (jsonb / string / list) a lista
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
