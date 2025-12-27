# Imagen base
FROM python:3.11-slim

# Instalar dependencias del sistema (incluye PostgreSQL client)
RUN apt-get update && \
    apt-get install -y postgresql-client && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Crear carpeta de trabajo
WORKDIR /app

# Copiar requirements
COPY requirements.txt requirements.txt

# Instalar dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar app
COPY . .

# Copiar script de espera
COPY wait-for-postgres.sh /wait-for-postgres.sh
RUN chmod +x /wait-for-postgres.sh

# Exponer puerto del backend
EXPOSE 8080

# Comando por defecto (sobrescrito por docker-compose)
CMD ["python", "app.py"]
