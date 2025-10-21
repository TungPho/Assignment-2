// teacher.controller.integration.test.ts
// INTEGRATION TEST - Test Controller + Service tương tác với Database mock

import { Op } from "sequelize";

// Type definitions
interface Student {
  email: string;
  suspended: boolean;
  save: jest.Mock;
  reload?: jest.Mock;
}

interface Teacher {
  email: string;
  addStudent: jest.Mock;
  getStudents: jest.Mock;
  Students?: Student[];
}

interface Registration {
  id: number;
  teacherEmail: string;
  studentEmail: string;
}

interface FindAllOptions {
  where?: any; // Use any to handle dynamic Op operators
  attributes?: string[];
  include?: string | { model: string; where?: any; attributes?: string[] };
}

interface FindOneOptions {
  where: {
    email: string;
  };
  include?: string | { model: string; where?: any; attributes?: string[] };
}

interface MockDatabase {
  Student: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    findOrCreate: jest.Mock;
    create: jest.Mock;
    destroy: jest.Mock;
  };
  Teacher: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    findOrCreate: jest.Mock;
    create: jest.Mock;
    count: jest.Mock;
    destroy: jest.Mock;
  };
  Registration: {
    findAll: jest.Mock;
    destroy: jest.Mock;
  };
  _reset: () => void;
}

// Mock Database với in-memory store
const createInMemoryDatabase = (): MockDatabase => {
  const students = new Map<string, Student>();
  const teachers = new Map<string, Teacher>();
  const registrations: Registration[] = [];
  let registrationId = 1;

  return {
    Student: {
      findAll: jest.fn(async (options: FindAllOptions = {}) => {
        let result = Array.from(students.values());

        // Filter by where conditions
        if (options.where) {
          if (options.where.email) {
            // Handle Op.in operator
            const emailValue = options.where.email;
            if (typeof emailValue === "object" && !Array.isArray(emailValue)) {
              // Check for Op.in using symbol key
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
          if (options.where?.suspended !== undefined) {
            result = result.filter(
              (s) => s.suspended === options.where?.suspended
            );
          }
        }

        if (options.attributes) {
          return result.map((s) => {
            const obj: any = {};
            options.attributes!.forEach(
              (attr) => (obj[attr] = (s as any)[attr])
            );
            return obj;
          });
        }
        return result;
      }),
      findOne: jest.fn(async (options: FindOneOptions) => {
        const email = options.where.email;
        return students.get(email) || null;
      }),
      findOrCreate: jest.fn(async (options: { where: { email: string } }) => {
        const email = options.where.email;
        if (students.has(email)) {
          return [students.get(email), false];
        }
        const student: Student = {
          email,
          suspended: false,
          save: jest.fn(async function (this: Student) {
            students.set(this.email, this);
            return true;
          }),
        };
        students.set(email, student);
        return [student, true];
      }),
      create: jest.fn(async (data: { email: string; suspended?: boolean }) => {
        const student: Student = {
          email: data.email,
          suspended: data.suspended ?? false,
          save: jest.fn(async function (this: Student) {
            students.set(this.email, this);
            return true;
          }),
          reload: jest.fn(async function (this: Student) {
            const current = students.get(this.email);
            if (current) {
              Object.assign(this, current);
            }
          }),
        };
        students.set(data.email, student);
        return student;
      }),
      destroy: jest.fn(async () => {
        students.clear();
      }),
    },
    Teacher: {
      findAll: jest.fn(async (options: FindAllOptions = {}) => {
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
              .filter(Boolean) as Student[],
          }));
        }

        if (options.attributes) {
          return result.map((t) => {
            const obj: any = {};
            options.attributes!.forEach(
              (attr) => (obj[attr] = (t as any)[attr])
            );
            return obj;
          });
        }

        return result;
      }),
      findOne: jest.fn(async (options: FindOneOptions) => {
        const email = options.where.email;
        const teacher = teachers.get(email);
        if (!teacher) return null;

        // Handle nested include with model and where conditions
        if (options.include) {
          let studentsList = registrations
            .filter((r) => r.teacherEmail === email)
            .map((r) => students.get(r.studentEmail))
            .filter(Boolean) as Student[];

          // Handle include as object with model and where
          if (
            typeof options.include === "object" &&
            options.include &&
            "model" in options.include
          ) {
            const includeObj = options.include as {
              model: string;
              where?: any;
              attributes?: string[];
            };

            // Apply where conditions from include
            if (includeObj.where?.suspended !== undefined) {
              studentsList = studentsList.filter(
                (s) => s.suspended === includeObj.where?.suspended
              );
            }

            // Apply attributes if specified
            if (includeObj.attributes) {
              studentsList = studentsList.map((s) => {
                const obj: any = {};
                includeObj.attributes!.forEach(
                  (attr: string) => (obj[attr] = (s as any)[attr])
                );
                return obj;
              }) as Student[];
            }
          }
          // Handle include as string (old behavior)
          else if (options.include === "Students") {
            studentsList = studentsList.filter((s) => !s.suspended);
          }

          return {
            ...teacher,
            Students: studentsList,
          };
        }
        return teacher;
      }),
      findOrCreate: jest.fn(async (options: { where: { email: string } }) => {
        const email = options.where.email;
        if (teachers.has(email)) {
          return [teachers.get(email), false];
        }
        const teacher: Teacher = {
          email,
          addStudent: jest.fn(async (student: Student) => {
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
      create: jest.fn(async (data: { email: string }) => {
        const teacher: Teacher = {
          email: data.email,
          addStudent: jest.fn(async (student: Student) => {
            registrations.push({
              id: registrationId++,
              teacherEmail: data.email,
              studentEmail: student.email,
            });
          }),
          getStudents: jest.fn(async () => {
            return registrations
              .filter((r) => r.teacherEmail === data.email)
              .map((r) => students.get(r.studentEmail))
              .filter(Boolean);
          }),
        };
        teachers.set(data.email, teacher);
        return teacher;
      }),
      count: jest.fn(async (options?: { where?: { email: string } }) => {
        if (options?.where?.email) {
          return teachers.has(options.where.email) ? 1 : 0;
        }
        return teachers.size;
      }),
      destroy: jest.fn(async () => {
        teachers.clear();
      }),
    },
    Registration: {
      findAll: jest.fn(async () => {
        return [...registrations];
      }),
      destroy: jest.fn(async () => {
        registrations.length = 0;
      }),
    },
    // Helper để reset database
    _reset: () => {
      students.clear();
      teachers.clear();
      registrations.length = 0;
      registrationId = 1;
    },
  };
};

const mockDb = createInMemoryDatabase();

// Mock Database module
jest.mock("../src/dbs/db.connect", () => ({
  getInstance: jest.fn(() => mockDb),
}));

// Import sau khi mock
import teacherBusinessController from "../src/controllers/teacher.controller";

interface MockResponse {
  status: jest.Mock;
  json: jest.Mock;
}

function createMockRes(): MockResponse {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

interface MockRequest {
  body?: any;
  query?: any;
}

describe("TeacherBusinessController - Integration Tests", () => {
  beforeEach(() => {
    mockDb._reset();
    jest.clearAllMocks();
  });

  describe("getAllStudents - Integration", () => {
    it("should return all students from database", async () => {
      await mockDb.Student.create({
        email: "student1@mail.com",
        suspended: false,
      });
      await mockDb.Student.create({
        email: "student2@mail.com",
        suspended: true,
      });

      const req: MockRequest = {};
      const res = createMockRes();

      await teacherBusinessController.getAllStudents(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        students: expect.arrayContaining([
          expect.objectContaining({ email: "student1@mail.com" }),
          expect.objectContaining({ email: "student2@mail.com" }),
        ]),
      });
    });

    it("should return empty array when no students", async () => {
      const req: MockRequest = {};
      const res = createMockRes();

      await teacherBusinessController.getAllStudents(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ students: [] });
    });
  });

  describe("getAllTeachers - Integration", () => {
    it("should return all teachers from database", async () => {
      await mockDb.Teacher.create({ email: "teacher1@mail.com" });
      await mockDb.Teacher.create({ email: "teacher2@mail.com" });

      const req: MockRequest = {};
      const res = createMockRes();

      await teacherBusinessController.getAllTeachers(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        teachers: expect.arrayContaining([
          expect.objectContaining({ email: "teacher1@mail.com" }),
          expect.objectContaining({ email: "teacher2@mail.com" }),
        ]),
      });
    });
  });

  describe("getAllRegistrations - Integration", () => {
    it("should return all registrations with actual relationships", async () => {
      const teacher = await mockDb.Teacher.create({
        email: "teacher@mail.com",
      });
      const student = await mockDb.Student.create({
        email: "student@mail.com",
      });
      await teacher.addStudent(student);

      const req: MockRequest = {};
      const res = createMockRes();

      await teacherBusinessController.getAllRegistraions(
        req as any,
        res as any
      );

      expect(res.status).toHaveBeenCalledWith(200);
      const registrations = res.json.mock.calls[0][0].registrations;
      expect(registrations.length).toBeGreaterThan(0);
    });
  });

  describe("registerStudentForTeacher - Integration", () => {
    it("should create teacher, student and registration in database", async () => {
      const req: MockRequest = {
        body: {
          teacher: "newteacher@mail.com",
          students: ["newstudent1@mail.com", "newstudent2@mail.com"],
        },
      };
      const res = createMockRes();

      await teacherBusinessController.registerStudentForTeacher(
        req as any,
        res as any
      );

      expect(res.status).toHaveBeenCalledWith(201);

      // Verify teacher created
      const teacherInDb = await mockDb.Teacher.findOne({
        where: { email: "newteacher@mail.com" },
      });
      expect(teacherInDb).not.toBeNull();

      // Verify students created
      const student1InDb = await mockDb.Student.findOne({
        where: { email: "newstudent1@mail.com" },
      });
      const student2InDb = await mockDb.Student.findOne({
        where: { email: "newstudent2@mail.com" },
      });
      expect(student1InDb).not.toBeNull();
      expect(student2InDb).not.toBeNull();

      // Verify relationships
      const students = await teacherInDb!.getStudents();
      expect(students.length).toBe(2);
    });

    it("should handle existing teacher and new students", async () => {
      await mockDb.Teacher.create({ email: "existing@mail.com" });

      const req: MockRequest = {
        body: {
          teacher: "existing@mail.com",
          students: ["fresh@mail.com"],
        },
      };
      const res = createMockRes();

      await teacherBusinessController.registerStudentForTeacher(
        req as any,
        res as any
      );

      expect(res.status).toHaveBeenCalledWith(201);

      const teacherCount = await mockDb.Teacher.count({
        where: { email: "existing@mail.com" },
      });
      expect(teacherCount).toBe(1);
    });

    it("should return 400 for invalid payload", async () => {
      const req: MockRequest = {
        body: { teacher: "", students: "not-an-array" },
      };
      const res = createMockRes();

      await teacherBusinessController.registerStudentForTeacher(
        req as any,
        res as any
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid payload" });
    });
  });

  describe("getCommonStudents - Integration", () => {
    it("should return students registered to all specified teachers", async () => {
      const teacher1 = await mockDb.Teacher.create({
        email: "teacher1@mail.com",
      });
      const teacher2 = await mockDb.Teacher.create({
        email: "teacher2@mail.com",
      });

      const commonStudent = await mockDb.Student.create({
        email: "common@mail.com",
      });
      const student1Only = await mockDb.Student.create({
        email: "only1@mail.com",
      });

      await teacher1.addStudent(commonStudent);
      await teacher2.addStudent(commonStudent);
      await teacher1.addStudent(student1Only);

      const req: MockRequest = {
        query: { teacher: "teacher1@mail.com,teacher2@mail.com" },
      };
      const res = createMockRes();

      await teacherBusinessController.getCommonStudents(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        students: ["common@mail.com"],
      });
    });

    it("should return empty array when no common students", async () => {
      const teacher1 = await mockDb.Teacher.create({ email: "t1@mail.com" });
      const teacher2 = await mockDb.Teacher.create({ email: "t2@mail.com" });

      const student1 = await mockDb.Student.create({ email: "s1@mail.com" });
      const student2 = await mockDb.Student.create({ email: "s2@mail.com" });

      await teacher1.addStudent(student1);
      await teacher2.addStudent(student2);

      const req: MockRequest = {
        query: { teacher: "t1@mail.com,t2@mail.com" },
      };
      const res = createMockRes();

      await teacherBusinessController.getCommonStudents(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ students: [] });
    });

    it("should return 400 when teacher emails missing", async () => {
      const req: MockRequest = { query: {} };
      const res = createMockRes();

      await teacherBusinessController.getCommonStudents(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("suspendStudent - Integration", () => {
    it("should suspend student in database", async () => {
      const student = await mockDb.Student.create({
        email: "tosuspend@mail.com",
        suspended: false,
      });

      const req: MockRequest = { body: { student: "tosuspend@mail.com" } };
      const res = createMockRes();

      await teacherBusinessController.suspendStudent(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(204);

      await student.reload!();
      expect(student.suspended).toBe(true);
    });

    it("should return 404 when student not found", async () => {
      const req: MockRequest = { body: { student: "notexist@mail.com" } };
      const res = createMockRes();

      await teacherBusinessController.suspendStudent(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Student not found" });
    });

    it("should return 400 when student email not provided", async () => {
      const req: MockRequest = { body: {} };
      const res = createMockRes();

      await teacherBusinessController.suspendStudent(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getStudentListThatRecieveNotifications - Integration", () => {
    it("should return registered students who are not suspended", async () => {
      const teacher = await mockDb.Teacher.create({
        email: "teacher@mail.com",
      });
      const activeStudent = await mockDb.Student.create({
        email: "active@mail.com",
        suspended: false,
      });
      const suspendedStudent = await mockDb.Student.create({
        email: "suspended@mail.com",
        suspended: true,
      });

      await teacher.addStudent(activeStudent);
      await teacher.addStudent(suspendedStudent);

      const req: MockRequest = {
        body: {
          teacher: "teacher@mail.com",
          notification: "Hello everyone",
        },
      };
      const res = createMockRes();

      await teacherBusinessController.getStudentListThatRecieveNotifications(
        req as any,
        res as any
      );

      expect(res.status).toHaveBeenCalledWith(200);
      const recipients = res.json.mock.calls[0][0].recipients;
      expect(recipients).toContain("active@mail.com");
      expect(recipients).not.toContain("suspended@mail.com");
    });

    it("should include mentioned students from notification", async () => {
      const teacher = await mockDb.Teacher.create({
        email: "teacher@mail.com",
      });
      const registeredStudent = await mockDb.Student.create({
        email: "registered@mail.com",
      });
      const mentionedStudent = await mockDb.Student.create({
        email: "mentioned@mail.com",
      });

      await teacher.addStudent(registeredStudent);

      const req: MockRequest = {
        body: {
          teacher: "teacher@mail.com",
          notification: "Hello @mentioned@mail.com",
        },
      };
      const res = createMockRes();

      await teacherBusinessController.getStudentListThatRecieveNotifications(
        req as any,
        res as any
      );

      expect(res.status).toHaveBeenCalledWith(200);
      const recipients = res.json.mock.calls[0][0].recipients;
      expect(recipients).toContain("registered@mail.com");
      expect(recipients).toContain("mentioned@mail.com");
    });

    it("should not include suspended mentioned students", async () => {
      await mockDb.Teacher.create({ email: "teacher@mail.com" });
      await mockDb.Student.create({
        email: "suspended@mail.com",
        suspended: true,
      });

      const req: MockRequest = {
        body: {
          teacher: "teacher@mail.com",
          notification: "Hi @suspended@mail.com",
        },
      };
      const res = createMockRes();

      await teacherBusinessController.getStudentListThatRecieveNotifications(
        req as any,
        res as any
      );

      expect(res.status).toHaveBeenCalledWith(200);
      const recipients = res.json.mock.calls[0][0].recipients;
      expect(recipients).not.toContain("suspended@mail.com");
    });

    it("should return 400 when teacher or notification missing", async () => {
      const req: MockRequest = { body: { teacher: "" } };
      const res = createMockRes();

      await teacherBusinessController.getStudentListThatRecieveNotifications(
        req as any,
        res as any
      );

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
