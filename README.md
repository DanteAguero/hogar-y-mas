🏠 Hogar y Más — E-commerce Demo

Hogar y Más es una aplicación web de comercio electrónico desarrollada como demo funcional para pequeños y medianos negocios, enfocada en rapidez de personalización, despliegue sencillo y experiencia de usuario clara.

El proyecto está pensado como base reutilizable para tiendas online reales, con panel de administración, gestión de productos, seguridad básica y arquitectura lista para producción.

🔗 Demo online:
👉 https://hogar-y-mas-web.onrender.com

✨ Características principales

🛒 Catálogo de productos dinámico

🔍 Buscador en tiempo real

📄 Vista de detalle de producto

🧑‍💻 Panel de administración

🔐 Login con usuario y contraseña

🔑 Contraseñas hasheadas

🔒 Autenticación en dos pasos (2FA)

🖼 Imágenes alojadas en Supabase

📱 Diseño responsive (mobile first)

🚀 Despliegue en Render

🐳 Docker + Docker Compose

🗄 PostgreSQL como base de datos

🧩 Arquitectura modular y escalable

🧱 Stack tecnológico

Frontend

HTML5

CSS3

JavaScript (Vanilla)

Backend

Python

Flask

Base de datos

PostgreSQL

Infraestructura

Docker

Docker Compose

Render (deploy)

Supabase (storage de imágenes)

🧑‍💼 Panel de administración

El sistema incluye un panel de administración protegido, desde el cual el usuario puede:

Crear y editar productos

Gestionar precios y stock

Subir imágenes (vía Supabase)

Acceder mediante autenticación segura

Utilizar doble factor de autenticación

Este enfoque permite que clientes no técnicos puedan administrar su tienda sin depender de un desarrollador.

🔒 Seguridad

Hash de contraseñas

Sesiones protegidas

Autenticación en dos pasos

Separación clara entre frontend y backend

Variables sensibles gestionadas por entorno

📦 Arquitectura

El proyecto está organizado de forma clara:

/static        → estilos, scripts, assets
/templates     → vistas HTML
/app.py        → aplicación principal Flask
/docker-compose.yml
/Dockerfile
/requirements.txt


Esto permite:

Escalar el proyecto

Adaptarlo a distintos negocios

Integrarlo con pasarelas de pago o APIs externas

🚀 Deploy

La aplicación está desplegada en Render, utilizando contenedores Docker y PostgreSQL.

El flujo de despliegue está preparado para:

Entornos de prueba

Entornos productivos

Reutilización del proyecto para otros clientes

🔐 Proyectos relacionados (privados)

Este repositorio corresponde a una demo pública.

Existe una versión PRO en repositorio privado, utilizada como producto comercial reutilizable, que incluye:

🛍 Carrito de compras

📲 Checkout directo a WhatsApp

🖼 Galería con zoom y sticky images

🧠 Recomendaciones ("También te puede gustar")

🎨 Diseño editorial orientado a marcas de indumentaria

⚙️ Configuración avanzada para clientes reales

El código de esa versión es privado por motivos comerciales, pero el flujo completo puede demostrarse en vivo o mediante capturas bajo solicitud.

👤 Autor

Dante Agüero
Full Stack Developer

GitHub: https://github.com/DanteAguero

Especialización: e-commerce, automatización, Flask, Docker, UX orientado a conversión

📌 Nota

Este proyecto fue desarrollado con foco en casos reales, priorizando:

Usabilidad

Seguridad básica

Tiempo de entrega

Facilidad de adaptación para distintos rubros
