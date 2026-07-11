# SEU Course Guide (seu-cg)

A comprehensive, specialized course management and learning guide system designed for **Southeast University (SEU)** students. This application features a React frontend and a Node.js/Express backend, providing a seamless interface to store, organize, and discover educational materials.

---

## 🔒 License & Ownership Notice

**Copyright © 2026 Mehdi Rohan. All rights reserved.**

This project is the sole property of **Mehdi Rohan**. 

* **No Redistribution:** You may not copy, modify, distribute, publish, or sublicense this software or any part of it without explicit written permission from the owner.
* **DMCA Notice:** Any unauthorized re-uploads, mirroring, or forks claiming ownership or violating these terms will be met with a formal DMCA takedown request under GitHub's copyright policies.

---

## 🎯 Project Purpose

The **SEU Course Guide** is created to empower Southeast University students to learn smarter and achieve greater. It centralizes academic resources, making it easy to download course notes, practice previous exam question papers, learn from toppers, and manage files under organized course structures.

---

## ✨ Key Features

### 🎓 For Students (Users)
* **Smart Dashboard:** View enrolled courses and access guides.
* **Course Note Manager:** Browse and download high-quality lecture notes and guidelines.
* **Practice Question Bank:** Access previous semester exam questions for effective preparation.
* **Top Scholars Board:** Connect with high-achieving peers and learn from their tips.

### 🛠️ For Administrators
* **Resource Management:** Upload and catalog new PDF notes, slides, and exam papers.
* **Folder Structure Controller:** Organize resources by courses, semesters, or departments.
* **User & Scholar Directory:** Manage users and assign top scholar roles.

### ⚙️ Backend & API
* **Secure Authentication:** User sign-up and login with password hashing.
* **Material Upload System:** Secure file handling for notes, assignments, and sample papers.
* **Database Integration:** Reliable storage for user data, course configurations, and resources.

---

## 🛠️ Tech Stack
* **Frontend:** React, HTML5, Vanilla CSS, Lucide Icons, JavaScript (ES6)
* **Backend:** Node.js, Express.js
* **Utilities:** Git

---

## 📥 Getting Started

### Prerequisites
* Node.js (v18.0.0 or higher recommended)
* npm

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MehdiRohan/seu-cg.git
   cd seu-cg
   ```

2. **Setup Backend:**
   ```bash
   cd seu-course-guide-backend
   npm install
   # Create a .env file and set PORT, DB credentials, etc.
   npm start
   ```

3. **Setup Frontend:**
   ```bash
   cd ../seu-course-guide
   npm install
   npm start
   ```
