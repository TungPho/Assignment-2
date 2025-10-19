# GovTech NodeJS API Assessment

## 📌 Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Folder Structure](#folder-structure)
- [Technology Stack](#technology-stack)
- [Requirements](#requirements)
- [Environment Configuration](#environment-configuration)
- [Installation](#installation)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Deployment (Optional)](#deployment-optional)
- [License & Author](#license--author)

---

## Introduction

This project is a RESTful API service designed for teachers to manage their students.  
Teachers and students are uniquely identified by their email addresses.

This API enables teachers to:

- Register multiple students.
- Retrieve common students.
- Suspend a student.
- Retrieve eligible students to receive notifications.

> ✅ Authentication and authorization are assumed to be already handled.

---

## Features

- Register one or more students to a teacher.
- List students common to multiple teachers.
- Suspend students from receiving notifications.
- Retrieve notification recipients based on registration & mentions.

---

## Folder Structure

assignment/
├── **test**/ # Automated tests using Jest & Supertest
│ └── (test files...)
│
├── node_modules/ # Dependencies installed by npm
│
├── src/
│ ├── controllers/ # Handles HTTP requests & responses
│ │ └── teacher.controller.ts
│ │
│ ├── dbs/ # Database connection and Sequelize initialization
│ │ └── db.connect.ts
│ │
│ ├── models/ # Sequelize models representing database tables
│ │ ├── registration.ts
│ │ ├── student.ts
│ │ └── teacher.ts
│ │
│ ├── routes/ # Application routing layer
│ │ └── teacher.business.route.ts
│ │
│ ├── services/ # Business logic & interaction with models
│ │ └── teacher.service.ts
│ │
│ ├── app.ts # Express app configuration (middleware, routes, etc.)
│ ├── seed.ts # Seed script for populating initial database data
│ └── server.ts (optional) # Main server entry point (if exists or may be created)
│
├── .dockerignore # Files and folders excluded from Docker image
├── .env # Environment configuration (not pushed to VCS)
├── .env.example # Sample environment variables for setup
├── .gitignore # Files ignored by Git
│
├── docker-compose.yml # Multi-container Docker orchestration
├── Dockerfile # Docker build configuration
│
├── jest.config.js # Jest testing configuration
├── package.json # Project metadata, scripts, and dependencies
├── package-lock.json # Locked versions of installed dependencies
│
├── README.md # Project documentation (this file)
└── tsconfig.json # TypeScript compiler configuration

## Requirements

- [Node.js](https://nodejs.org/) (version 20)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Docker] (https://www.docker.com/products/docker-desktop/)
- [MySQL] (https://www.mysql.com/downloads/) (for manual install only)

---

## Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/TungPho/Assignment-2.git
   cd mock-project
   ```
2. **Run with Docker (Recommended)**

```sh
    cd mock-project
   docker compose up --build
```

- Frontend: [http://localhost]
- Backend: [http://localhost:3000]
- MySQL: port 3306, user: root, pass: password

3. **Run manually**

```sh
   cd mock-project
   cd frontend
   npm install
   npm run dev
```

```sh
    cd mock-project
cd backend
npm install
npm run start
```

---
