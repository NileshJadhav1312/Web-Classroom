# WebClassroom: Digital Learning Ecosystem 🎓

WebClassroom is a modern, full-stack Learning Management System (LMS) designed to bridge the gap between students and lecturers. It provides a secure, streamlined environment for managing courses, sharing learning materials, tracking attendance, and facilitating academic collaboration.

---

## 🌟 Key Features

### 👥 Role-Based Portals
- **Admin Dashboard**: Full system control including user management, departmental overview, and site-wide analytics.
- **Lecturer Hub**: Create and manage courses, upload lecture materials, handle student enrollments, and track course-specific progress.
- **Student Portal**: Browse available courses, request enrollment via join codes, access learning materials, and track personal academic progress.

### 📚 Academic Management
- **Course Lifecycle**: End-to-end course management from creation to materials distribution.
- **Smart Enrollments**: Interactive enrollment system with join codes and approval workflows.
- **Material Sharing**: Secure file uploads (PDF, DOCX, PPTX) for lecture notes and resources.
- **Real-time Notifications**: Keep everyone updated with live announcements and push notifications.
- **Attendance & Analytics**: Built-in tools for tracking student participation and performance.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: React Context & [TanStack Query](https://tanstack.com/query/latest)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **UI Components**: Modern, responsive, and accessibility-focused design system.

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Security**: JWT (JSON Web Tokens) & Bcrypt password hashing
- **File Storage**: [Multer](https://github.com/expressjs/multer) for local file management

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local instance or Atlas)
- npm or yarn

### 1. Project Setup
Clone the repository and install dependencies for both the frontend and backend.

```bash
# Clone the repository
git clone https://github.com/yourusername/WebClassroom.git
cd WebClassroom

# Install Backend dependencies
cd backend
npm install

# Install Frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration
Create environment files in both the `backend` and `frontend` directories.

#### Backend (`backend/.env`)
```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/webclassroom
JWT_SECRET=your_super_secret_key
FRONTEND_URL=http://localhost:3000
```

#### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_UPLOAD_URL=http://localhost:4000/uploads
```

### 3. Running Locally
You can run both servers independently.

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

---

## 📂 Project Structure

```text
WebClassroom/
├── backend/                # Node.js Express API
│   ├── src/
│   │   ├── controllers/    # API logic handlers
│   │   ├── models/         # Database schemas
│   │   ├── routes/         # API endpoints
│   │   └── app.js          # Server configuration
│   └── uploads/            # Shared learning materials
├── frontend/               # Next.js Application
│   ├── src/
│   │   ├── app/            # Pages and layouts
│   │   ├── components/     # UI elements
│   │   ├── services/       # API interaction layer
│   │   └── context/        # Global state management
│   └── public/             # Static assets
└── README.md               # Root documentation
```

---

## 🔒 Security
- **Authentication**: Secure login using JSON Web Tokens (JWT).
- **CORS**: Configured to safely respond to the frontend application while maintaining cross-origin security.
- **Privacy**: Role-based access control (RBAC) ensures only authorized users can modify course content or access sensitive data.

---

## 🤝 Contributing
Contributions are welcome! If you'd like to improve WebClassroom, please follow these steps:
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---

**Built with ❤️ for better classrooms.**