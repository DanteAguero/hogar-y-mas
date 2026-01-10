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
