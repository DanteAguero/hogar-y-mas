🏠 Hogar y Más – Plataforma E-commerce Personalizable

Plataforma web de comercio electrónico desarrollada desde cero, pensada para pequeños emprendimientos que necesitan una tienda online simple, rápida y autoadministrable.

👉 Demo en producción:
https://hogar-y-mas-web.onrender.com

📌 Descripción general

Hogar y Más es una aplicación web full stack que permite:

Mostrar un catálogo de productos dinámico

Gestionar productos desde un panel de administración seguro

Consultar stock y detalles de cada producto

Contactar al vendedor vía WhatsApp

Personalizar rápidamente el contenido sin conocimientos técnicos

El sistema está diseñado para ser fácil de mantener, seguro y listo para producción.

🚀 Funcionalidades principales
🛍️ Tienda

Catálogo de productos dinámico

Vista de detalle por producto

Búsqueda rápida

Etiquetas de productos (NEW / SALE)

Diseño responsive (mobile y desktop)

🔐 Panel de administración

Acceso mediante usuario y contraseña

Contraseñas almacenadas con hash

Autenticación en dos pasos

Gestión de productos (alta / edición / stock)

Control de disponibilidad

☁️ Infraestructura

Despliegue en la nube

Base de datos persistente

Imágenes alojadas externamente

🧱 Tecnologías utilizadas
Backend

Python

Flask

PostgreSQL

Autenticación segura

APIs REST

Frontend

HTML

CSS

JavaScript

Diseño responsive

DevOps / Infraestructura

Docker

Docker Compose

Render (deploy)

Supabase (almacenamiento de imágenes)

Git & GitHub

🗂️ Estructura del proyecto
├── aplicacion.py
├── centro/
│   └── lógica del backend
├── plantillas/
│   └── vistas HTML
├── estatico/
│   ├── css/
│   ├── js/
│   └── imágenes
├── docker-compose.yml
├── Dockerfile
├── requisitos.txt
└── esperar-a-postgres.sh

🐳 Ejecución con Docker
docker compose up --build


La aplicación quedará disponible en:

http://localhost:5000

🔒 Seguridad

Contraseñas protegidas mediante hashing

Autenticación con validaciones adicionales

Acceso restringido al panel de administración

Separación clara entre frontend y backend

🎯 Objetivo del proyecto

Este proyecto fue desarrollado como:

Solución real para un comercio

Ejemplo de arquitectura full stack moderna

Base reutilizable para otras tiendas online

Proyecto demostrable para portafolio profesional

👨‍💻 Autor

Dante Agüero
Desarrollador Full Stack

GitHub: https://github.com/DanteAguero

Demo: https://hogar-y-mas-web.onrender.com

📄 Licencia

Proyecto de uso demostrativo y educativo.
Puede adaptarse o extenderse según necesidad.
