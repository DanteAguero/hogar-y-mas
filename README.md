# 🏠 Hogar y Más — E-commerce Web Application (Demo)

Full stack e-commerce web application developed with **Python and Flask**, focused on clean architecture, usability and production-ready deployment.

This project was built as a **technical demonstration**, showcasing backend development, responsive frontend, authentication, security basics and Docker-based deployment. It is designed as a reusable base for real-world e-commerce projects.

🔗 **Live Demo**  
👉 https://hogar-y-mas-web.onrender.com

---

## 🧩 Tech Stack

### Frontend
- HTML5  
- CSS3  
- JavaScript (Vanilla)

### Backend
- Python  
- Flask  

### Database
- PostgreSQL  

### Infrastructure
- Docker  
- Docker Compose  
- Render (deployment)  
- Supabase (image storage)

---

## ✨ Key Features

- Dynamic product catalog  
- Real-time search  
- Product detail views  
- Admin panel with authentication  
- Password hashing  
- Two-factor authentication (2FA)  
- Responsive design (mobile-first)  
- Dockerized deployment  
- Modular and scalable architecture  
- Production-oriented project structure  

---

## 🧠 Purpose

This project was developed to demonstrate my **full stack development skills**, focusing on:

- Backend logic and data handling  
- Secure authentication flows  
- Clean and maintainable architecture  
- Deployment workflows using Docker  
- User experience and responsive design  

---

## 🧑‍💻 Admin Panel

The application includes a protected admin panel that allows non-technical users to manage the store:

- Create and edit products  
- Manage prices and stock  
- Upload product images (via Supabase)  
- Secure login system  
- Two-factor authentication  

This approach enables store owners to manage their content without developer intervention.

---

## 🔒 Security

Basic security practices implemented in the project include:

- Password hashing  
- Protected sessions  
- Two-factor authentication (2FA)  
- Clear separation between frontend and backend  
- Sensitive configuration handled through environment variables  

---

## 📦 Architecture

The project is organized with a clear and maintainable structure:

```text
/static            → styles, scripts, assets
/templates         → HTML views
/app.py            → main Flask application
/docker-compose.yml
/Dockerfile
/requirements.txt
This structure allows the project to be:

Easily scalable

Adaptable to different business needs

Ready for integration with payment gateways or external APIs

🚀 Deployment

The application is deployed on Render, using Docker containers and PostgreSQL.

The deployment workflow is prepared for:

Development environments

Production environments

Reuse of the project as a base for other applications

🔐 Related Work (Private)

This public repository represents a demo version of the project.

A more advanced private version exists and is used in real commercial projects. It includes additional features such as:

Shopping cart

Checkout flow (WhatsApp integration)

Enhanced product galleries (zoom, sticky images)

Product recommendations

Editorial-style UI for fashion brands

Advanced configuration for real clients

The private codebase is not publicly available for commercial reasons, but the full workflow can be demonstrated if required.

👤 Author

Dante Agüero
Full Stack Developer

GitHub: https://github.com/DanteAguero

Specialization:

Python & Flask

E-commerce platforms

Automation

Docker

UX focused on conversion
