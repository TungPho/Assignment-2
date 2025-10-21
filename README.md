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

```
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
```

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

````

2. **Run manually**

Create seed data
```sh
   cd assignment
   npm install
   npm run seed
```

```sh
   cd assignment
   npm install
   npm run start
```
````

## API Endpoints

GET /api/v1/students (Get list of students)

Example response: (http://localhost:3000/api/students) (JSON):

```json
{
  "students": [
    {
      "email": "studentjon@gmail.com",
      "suspended": false
    },
    {
      "email": "studenthon@gmail.com",
      "suspended": false
    },
    {
      "email": "studentmary@gmail.com",
      "suspended": false
    }
  ]
}
```

GET /api/v1/teachers (Get list of teachers)

Example response: (http://localhost:3000/api/teachers) (JSON):

```json
{
  "teachers": [
    {
      "email": "teacherjoe@gmail.com"
    },
    {
      "email": "teacherken@gmail.com"
    }
  ]
}
```

GET /api/v1/registrations (Get list of registrations)

Example response: (http://localhost:3000/api/registrations) (JSON):

```json
{
  "registrations": [
    {
      "TeacherId": 2,
      "StudentId": 1
    }
  ]
}
```

--- Main API Endpoints

POST /api/v1/register (Register a student for a teacher)

Example response: (http://localhost:3000/api/registrations) (JSON):

```json
{
  "registrations": [
    {
      "TeacherId": 2,
      "StudentId": 1
    }
  ]
}
```

GET /api/v1/commonstudents (Get common students)
Example body (JSON):

```json
{
  "teacher": "teacherjoe@gmail.com",
  "students": ["studentjon@gmail.com"]
}
```

Example response: (http://localhost:3000/api/commonstudents?teacher=teacherjoe%40gmail.com) (JSON):

```json
{
  "students": ["studentjon@gmail.com"]
}
```

POST /api/v1/suspend (suspend a student)
Example body (JSON):

```json
{
  "student": "studentmary@gmail.com"
}
```

Example response: (http://localhost:3000/api/suspend) (JSON):
The response will return 204

````

POST /api/v1/suspend (suspend a student)
Example body (JSON):

```json
{
  "student": "studentmary@gmail.com"
}
````

Example response: (http://localhost:3000/api/suspend) (JSON):
The response will return 204

POST /api/v1/suspend (suspend a student)
Example body (JSON):

```json
{
  "student": "studentmary@gmail.com"
}
```

POST /api/v1/retrievefornotifications (get students who retrieved the notifications from the teacher)
Example response: (http://localhost:3000/api/retrievefornotifications) (JSON):
Example body (JSON):

```json
{
  "teacher": "teacherjoe@gmail.com",
  "notification": "Hello students! @studentagnes@gmail.com @studentmary@gmail.com"
}
```

```json
{
  "recipients": ["studentjon@gmail.com", "studentagnes@gmail.com"]
}
```
