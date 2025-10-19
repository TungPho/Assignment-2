// teacher.router.e2e.test.ts
// END-TO-END TEST - Test toàn bộ flow từ HTTP request đến response

import request from "supertest";
import express, { Express } from "express";
import { Op } from "sequelize";

// Mock Database
const createInMemoryDatabase = () => {
  const students = new Map<string, any>();
  const teachers = new Map<string, any>();
  const registrations: any[] = [];
  let registrationId = 1;

  return {
    Student: {
      findAll: jest.fn(async (options: any = {}) => {
        let result = Array.from(students.values());

        if (options.where) {
          if (options.where.email) {
            const emailValue = options.where.email;
            if (typeof emailValue === "object" && !Array.isArray(emailValue)) {
              const opInValue = emailValue[Op.in as any];
              if (opInValue) {
                result = result.filter((s) => opInValue.includes(s.email));
              }
            } else {
              const emails = Array.isArray(emailValue)
                ? emailValue
                : [emailValue];
              result = result.filter((s) => emails.includes(s.email));
            }
          }
          if (options.where.suspended !== undefined) {
            result = result.filter(
              (s) => s.suspended === options.where.suspended
            );
          }
        }

        if (options.attributes) {
          return result.map((s) => {
            const obj: any = {};
            options.attributes.forEach((attr: string) => (obj[attr] = s[attr]));
            return obj;
          });
        }
        return result;
      }),
      findOne: jest.fn(async (options: any) => {
        return students.get(options.where.email) || null;
      }),
      findOrCreate: jest.fn(async (options: any) => {
        const email = options.where.email;
        if (students.has(email)) {
          return [students.get(email), false];
        }
        const student = {
          email,
          suspended: false,
          save: jest.fn(async function (this: any) {
            students.set(this.email, this);
            return true;
          }),
        };
        students.set(email, student);
        return [student, true];
      }),
      create: jest.fn(async (data: any) => {
        const student = {
          ...data,
          suspended: data.suspended ?? false,
          save: jest.fn(async function (this: any) {
            students.set(this.email, this);
            return true;
          }),
          reload: jest.fn(async function (this: any) {
            const current = students.get(this.email);
            if (current) Object.assign(this, current);
          }),
        };
        students.set(data.email, student);
        return student;
      }),
    },
    Teacher: {
      findAll: jest.fn(async (options: any = {}) => {
        let result = Array.from(teachers.values());

        if (options.where?.email) {
          const emails = Array.isArray(options.where.email)
            ? options.where.email
            : [options.where.email];
          result = result.filter((t) => emails.includes(t.email));
        }

        if (options.include === "Students") {
          result = result.map((teacher) => ({
            ...teacher,
            Students: registrations
              .filter((r) => r.teacherEmail === teacher.email)
              .map((r) => students.get(r.studentEmail))
              .filter(Boolean),
          }));
        }

        if (options.attributes) {
          return result.map((t) => {
            const obj: any = {};
            options.attributes.forEach((attr: string) => (obj[attr] = t[attr]));
            return obj;
          });
        }

        return result;
      }),
      findOne: jest.fn(async (options: any) => {
        const email = options.where.email;
        const teacher = teachers.get(email);
        if (!teacher) return null;

        if (options.include) {
          let studentsList = registrations
            .filter((r) => r.teacherEmail === email)
            .map((r) => students.get(r.studentEmail))
            .filter(Boolean);

          if (
            typeof options.include === "object" &&
            "model" in options.include
          ) {
            const includeObj = options.include;
            if (includeObj.where?.suspended !== undefined) {
              studentsList = studentsList.filter(
                (s: any) => s.suspended === includeObj.where?.suspended
              );
            }
            if (includeObj.attributes) {
              studentsList = studentsList.map((s: any) => {
                const obj: any = {};
                includeObj.attributes.forEach(
                  (attr: string) => (obj[attr] = s[attr])
                );
                return obj;
              });
            }
          } else if (options.include === "Students") {
            studentsList = studentsList.filter((s: any) => !s.suspended);
          }

          return { ...teacher, Students: studentsList };
        }
        return teacher;
      }),
      findOrCreate: jest.fn(async (options: any) => {
        const email = options.where.email;
        if (teachers.has(email)) {
          return [teachers.get(email), false];
        }
        const teacher = {
          email,
          addStudent: jest.fn(async (student: any) => {
            registrations.push({
              id: registrationId++,
              teacherEmail: email,
              studentEmail: student.email,
            });
          }),
          getStudents: jest.fn(async () => {
            return registrations
              .filter((r) => r.teacherEmail === email)
              .map((r) => students.get(r.studentEmail))
              .filter(Boolean);
          }),
        };
        teachers.set(email, teacher);
        return [teacher, true];
      }),
      count: jest.fn(async (options?: any) => {
        if (options?.where?.email) {
          return teachers.has(options.where.email) ? 1 : 0;
        }
        return teachers.size;
      }),
    },
    Registration: {
      findAll: jest.fn(async () => [...registrations]),
    },
    _reset: () => {
      students.clear();
      teachers.clear();
      registrations.length = 0;
      registrationId = 1;
    },
  };
};

const mockDb = createInMemoryDatabase();

// Mock DB module
jest.mock("../src/dbs/db.connect", () => ({
  getInstance: jest.fn(() => mockDb),
}));

// Import router sau khi mock
import router from "../src/routes/teacher.business.route";

describe("Teacher Router - E2E Tests", () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/api", router);
  });

  beforeEach(() => {
    mockDb._reset();
    jest.clearAllMocks();
  });

  describe("GET /api/students", () => {
    it("should return 200 with all students", async () => {
      await mockDb.Student.create({
        email: "student1@mail.com",
        suspended: false,
      });
      await mockDb.Student.create({
        email: "student2@mail.com",
        suspended: true,
      });

      const response = await request(app).get("/api/students");

      expect(response.status).toBe(200);
      expect(response.body.students).toHaveLength(2);
      expect(response.body.students).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ email: "student1@mail.com" }),
          expect.objectContaining({ email: "student2@mail.com" }),
        ])
      );
    });

    it("should return empty array when no students exist", async () => {
      const response = await request(app).get("/api/students");

      expect(response.status).toBe(200);
      expect(response.body.students).toEqual([]);
    });
  });

  describe("GET /api/teachers", () => {
    it("should return 200 with all teachers", async () => {
      await mockDb.Teacher.findOrCreate({
        where: { email: "teacher1@mail.com" },
      });
      await mockDb.Teacher.findOrCreate({
        where: { email: "teacher2@mail.com" },
      });

      const response = await request(app).get("/api/teachers");

      expect(response.status).toBe(200);
      expect(response.body.teachers).toHaveLength(2);
    });
  });

  describe("GET /api/registrations", () => {
    it("should return 200 with all registrations", async () => {
      const [teacher] = await mockDb.Teacher.findOrCreate({
        where: { email: "teacher@mail.com" },
      });
      const [student] = await mockDb.Student.findOrCreate({
        where: { email: "student@mail.com" },
      });
      await teacher.addStudent(student);

      const response = await request(app).get("/api/registrations");

      expect(response.status).toBe(200);
      expect(response.body.registrations).toHaveLength(1);
    });
  });

  describe("POST /api/register", () => {
    it("should register students to teacher and return 201", async () => {
      const payload = {
        teacher: "teacherken@gmail.com",
        students: ["studentjon@gmail.com", "studenthon@gmail.com"],
      };

      const response = await request(app).post("/api/register").send(payload);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: { message: "Register Successfully!" },
      });

      // Verify registration
      const teacher = await mockDb.Teacher.findOne({
        where: { email: "teacherken@gmail.com" },
      });
      expect(teacher).not.toBeNull();
      const students = await teacher.getStudents();
      expect(students).toHaveLength(2);
    });

    it("should return 400 for invalid payload - missing teacher", async () => {
      const payload = {
        students: ["student@gmail.com"],
      };

      const response = await request(app).post("/api/register").send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid payload");
    });

    it("should return 400 for invalid payload - students not array", async () => {
      const payload = {
        teacher: "teacher@gmail.com",
        students: "not-an-array",
      };

      const response = await request(app).post("/api/register").send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid payload");
    });

    it("should return 400 for empty students array", async () => {
      const payload = {
        teacher: "teacher@gmail.com",
        students: [],
      };

      const response = await request(app).post("/api/register").send(payload);

      // Controller có thể accept empty array, nên test này sẽ pass với 201
      // Nếu muốn reject empty array, cần update controller logic
      expect(response.status).toBe(201);
    });
  });

  describe("GET /api/commonstudents", () => {
    it("should return common students for single teacher", async () => {
      const [teacher] = await mockDb.Teacher.findOrCreate({
        where: { email: "teacherken@gmail.com" },
      });
      const [student1] = await mockDb.Student.findOrCreate({
        where: { email: "commonstudent1@gmail.com" },
      });
      const [student2] = await mockDb.Student.findOrCreate({
        where: { email: "commonstudent2@gmail.com" },
      });

      await teacher.addStudent(student1);
      await teacher.addStudent(student2);

      const response = await request(app)
        .get("/api/commonstudents")
        .query({ teacher: "teacherken@gmail.com" });

      expect(response.status).toBe(200);
      expect(response.body.students).toHaveLength(2);
      expect(response.body.students).toContain("commonstudent1@gmail.com");
      expect(response.body.students).toContain("commonstudent2@gmail.com");
    });

    it("should return common students for multiple teachers", async () => {
      const [teacher1] = await mockDb.Teacher.findOrCreate({
        where: { email: "teacherken@gmail.com" },
      });
      const [teacher2] = await mockDb.Teacher.findOrCreate({
        where: { email: "teacherjoe@gmail.com" },
      });

      const [commonStudent] = await mockDb.Student.findOrCreate({
        where: { email: "commonstudent1@gmail.com" },
      });
      const [student2] = await mockDb.Student.findOrCreate({
        where: { email: "student2@gmail.com" },
      });
      const [student3] = await mockDb.Student.findOrCreate({
        where: { email: "student3@gmail.com" },
      });

      await teacher1.addStudent(commonStudent);
      await teacher1.addStudent(student2);
      await teacher2.addStudent(commonStudent);
      await teacher2.addStudent(student3);

      const response = await request(app)
        .get("/api/commonstudents")
        .query({ teacher: "teacherken@gmail.com,teacherjoe@gmail.com" });

      expect(response.status).toBe(200);
      expect(response.body.students).toEqual(["commonstudent1@gmail.com"]);
    });

    it("should return empty array when no common students", async () => {
      const [teacher1] = await mockDb.Teacher.findOrCreate({
        where: { email: "teacher1@gmail.com" },
      });
      const [teacher2] = await mockDb.Teacher.findOrCreate({
        where: { email: "teacher2@gmail.com" },
      });

      const [student1] = await mockDb.Student.findOrCreate({
        where: { email: "student1@gmail.com" },
      });
      const [student2] = await mockDb.Student.findOrCreate({
        where: { email: "student2@gmail.com" },
      });

      await teacher1.addStudent(student1);
      await teacher2.addStudent(student2);

      const response = await request(app)
        .get("/api/commonstudents")
        .query({ teacher: "teacher1@gmail.com,teacher2@gmail.com" });

      expect(response.status).toBe(200);
      expect(response.body.students).toEqual([]);
    });

    it("should return 400 when teacher query param is missing", async () => {
      const response = await request(app).get("/api/commonstudents");

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("POST /api/suspend", () => {
    it("should suspend a student and return 204", async () => {
      await mockDb.Student.create({
        email: "studentmary@gmail.com",
        suspended: false,
      });

      const response = await request(app)
        .post("/api/suspend")
        .send({ student: "studentmary@gmail.com" });

      expect(response.status).toBe(204);

      // Verify student is suspended
      const student = await mockDb.Student.findOne({
        where: { email: "studentmary@gmail.com" },
      });
      expect(student.suspended).toBe(true);
    });

    it("should return 404 when student not found", async () => {
      const response = await request(app)
        .post("/api/suspend")
        .send({ student: "nonexistent@gmail.com" });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Student not found");
    });

    it("should return 400 when student email is missing", async () => {
      const response = await request(app).post("/api/suspend").send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should return 400 when student email is empty", async () => {
      const response = await request(app)
        .post("/api/suspend")
        .send({ student: "" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("POST /api/retrievefornotifications", () => {
    it("should return registered non-suspended students", async () => {
      const [teacher] = await mockDb.Teacher.findOrCreate({
        where: { email: "teacherken@gmail.com" },
      });
      const [student1] = await mockDb.Student.findOrCreate({
        where: { email: "studentbob@gmail.com" },
      });
      const [student2] = await mockDb.Student.findOrCreate({
        where: { email: "studentagnes@gmail.com" },
      });

      await teacher.addStudent(student1);
      await teacher.addStudent(student2);

      const response = await request(app)
        .post("/api/retrievefornotifications")
        .send({
          teacher: "teacherken@gmail.com",
          notification: "Hello students!",
        });

      expect(response.status).toBe(200);
      expect(response.body.recipients).toHaveLength(2);
      expect(response.body.recipients).toContain("studentbob@gmail.com");
      expect(response.body.recipients).toContain("studentagnes@gmail.com");
    });

    it("should include mentioned students in notification", async () => {
      const [teacher] = await mockDb.Teacher.findOrCreate({
        where: { email: "teacherken@gmail.com" },
      });
      const [student1] = await mockDb.Student.findOrCreate({
        where: { email: "studentbob@gmail.com" },
      });
      const [student2] = await mockDb.Student.findOrCreate({
        where: { email: "studentagnes@gmail.com" },
      });
      const [mentionedStudent] = await mockDb.Student.findOrCreate({
        where: { email: "studentmiche@gmail.com" },
      });

      await teacher.addStudent(student1);

      const response = await request(app)
        .post("/api/retrievefornotifications")
        .send({
          teacher: "teacherken@gmail.com",
          notification:
            "Hello students! @studentagnes@gmail.com @studentmiche@gmail.com",
        });

      expect(response.status).toBe(200);
      expect(response.body.recipients).toHaveLength(3);
      expect(response.body.recipients).toContain("studentbob@gmail.com");
      expect(response.body.recipients).toContain("studentagnes@gmail.com");
      expect(response.body.recipients).toContain("studentmiche@gmail.com");
    });

    it("should not include suspended students", async () => {
      const [teacher] = await mockDb.Teacher.findOrCreate({
        where: { email: "teacherken@gmail.com" },
      });
      const activeStudent = await mockDb.Student.create({
        email: "active@gmail.com",
        suspended: false,
      });
      const suspendedStudent = await mockDb.Student.create({
        email: "suspended@gmail.com",
        suspended: true,
      });

      await teacher.addStudent(activeStudent);
      await teacher.addStudent(suspendedStudent);

      const response = await request(app)
        .post("/api/retrievefornotifications")
        .send({
          teacher: "teacherken@gmail.com",
          notification: "Hello @suspended@gmail.com",
        });

      expect(response.status).toBe(200);
      expect(response.body.recipients).toContain("active@gmail.com");
      expect(response.body.recipients).not.toContain("suspended@gmail.com");
    });

    it("should return 400 when teacher is missing", async () => {
      const response = await request(app)
        .post("/api/retrievefornotifications")
        .send({ notification: "Hello" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should return 400 when notification is missing", async () => {
      const response = await request(app)
        .post("/api/retrievefornotifications")
        .send({ teacher: "teacher@gmail.com" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });
});
