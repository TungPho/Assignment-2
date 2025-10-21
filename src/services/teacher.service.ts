import Database from "../dbs/db.connect";
const db = Database.getInstance();
const { Student, Teacher, Registration } = db;
import { Op } from "sequelize";

interface StudentAttributes {
  email: string;
  suspended: boolean;
}

interface TeacherAttributes {
  email: string;
}

interface RegistrationAttributes {
  // Nếu có fields cụ thể, bổ sung ở đây
}

class TeacherBusinessService {
  static async getAllStudents(): Promise<StudentAttributes[]> {
    const students = await Student.findAll({
      attributes: ["email", "suspended"],
    });
    return students.map((s: any) => ({
      email: s.email,
      suspended: s.suspended,
    }));
  }

  static async getAllTeachers(): Promise<TeacherAttributes[]> {
    const teachers = await Teacher.findAll({
      attributes: ["email"],
    });
    return teachers.map((t: any) => ({
      email: t.email,
    }));
  }

  static async getAllRegistrations(): Promise<any[]> {
    const registrations = await Registration.findAll({});
    return registrations;
  }

  // API 1: Register students for teacher
  static async registerStudentForTeacher(
    teacher: string,
    students: string[]
  ): Promise<{ message: string }> {
    const [teacherObj] = await Teacher.findOrCreate({
      where: { email: teacher },
    });
    for (const studentEmail of students) {
      const [studentObj] = await Student.findOrCreate({
        where: { email: studentEmail },
      });
      await teacherObj.addStudent(studentObj);
    }
    return { message: "Register Successfully!" };
  }

  // API 2: Get common students for multiple teachers
  static async getCommonStudents(emails: string[]): Promise<string[]> {
    const teachers = await Teacher.findAll({
      where: { email: emails },
      include: "Students",
    });

    // teachers[].Students là array các student object
    const studentLists: string[][] = teachers.map((t: any) =>
      t.Students.map((s: any) => s.email)
    );

    if (studentLists.length === 0) return [];

    const common = studentLists.reduce((a, b) =>
      a.filter((c) => b.includes(c))
    );
    return common;
  }

  // API 3: Suspend a student
  static async suspenseStudent(studentObj: any): Promise<boolean> {
    studentObj.suspended = true;
    await studentObj.save();
    return true;
  }

  // API 4: Get students which receive notifications
  static async getStudentsWhichRecievesNotifications(
    teacher: string,
    notification: string
  ): Promise<string[]> {
    // Lấy tất cả giáo viên theo email, kèm các student chưa bị suspend
    const teacherObjs = await Teacher.findOne({
      where: { email: teacher },
      include: {
        model: Student,
        where: { suspended: false },
        attributes: ["email"],
      },
    });

    let registeredStudents: string[] = [];
    if (teacherObjs && teacherObjs.Students) {
      registeredStudents = teacherObjs.Students.map(
        (student: any) => student.email
      );
    }
    // Regex tìm các email mention trong notification
    const mentionPattern = /@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const mentionedEmails: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = mentionPattern.exec(notification)) !== null) {
      mentionedEmails.push(match[1]);
    }

    let mentionedStudents: string[] = [];
    if (mentionedEmails.length > 0) {
      const studentsMentioned = await Student.findAll({
        where: {
          email: { [Op.in]: mentionedEmails },
          suspended: false,
        },
        attributes: ["email"],
      });
      mentionedStudents = studentsMentioned.map(
        (student: any) => student.email
      );
    }

    // Gộp danh sách, loại trùng
    const finalRecipients = Array.from(
      new Set([...registeredStudents, ...mentionedStudents])
    );
    return finalRecipients;
  }
}

export default TeacherBusinessService;
