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
├── test
│
├── node_modules
│
├── src/
│ ├── controllers
│ │ └── teacher.controller.ts
│ │
│ ├── dbs/
│ │ └── db.connect.ts
│ │
│ ├── models/
│ │ ├── registration.ts
│ │ ├── student.ts
│ │ └── teacher.ts
│ │
│ ├── routes/
│ │ └── teacher.business.route.ts
│ │
│ ├── services/
│ │ └── teacher.service.ts
│ │
│ ├── app.ts
│ ├── seed.ts
│ └── server.ts
│
├── .dockerignore
├── .env
├── .env.example
├── .gitignore
│
├── docker-compose.yml
├── Dockerfile
│
├── jest.config.js
├── package.json
├── package-lock.json
│
├── README.md
└── tsconfig.json
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
   cd Assignment-2
   ```

````

2. **Run manually (Must have MySQL DB installed on your local)**

Create seed data
```sh
   cd Assignment-2
   npm install
   npm run seed
```

```sh
   cd Assignment-2
   npm install
   npm run start
```
````

3. **Run manually (Using Docker Compose)**

```sh
   cd Assignment-2
   docker compose up --build
```

```

```
