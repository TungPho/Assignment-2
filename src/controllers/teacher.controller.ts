import { Request, Response } from "express";
import TeacherBusinessService from "../services/teacher.service";
import Database from "../dbs/db.connect";

const db = Database.getInstance();
const { Student, Teacher, Registration } = db;

class TeacherBusinessController {
  // get teachers and students
  public getAllStudents = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const students = await TeacherBusinessService.getAllStudents();
      return res.status(200).json({ students });
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };

  public getAllTeachers = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const teachers = await TeacherBusinessService.getAllTeachers();
      return res.status(200).json({ teachers });
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };

  public getAllRegistraions = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const registrations = await TeacherBusinessService.getAllRegistrations();
      return res.status(200).json({ registrations });
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // 1. Register Student
  public registerStudentForTeacher = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const { teacher, students } = req.body as {
        teacher?: string;
        students?: string[];
      };
      if (!teacher || !Array.isArray(students)) {
        return res.status(400).json({ error: "Invalid payload" });
      }
      const message = await TeacherBusinessService.registerStudentForTeacher(
        teacher,
        students
      );
      return res.status(201).json({ message });
    } catch (error) {
      return res.status(500).json({ message: error });
    }
  };

  // 2. Get Common Students
  public getCommonStudents = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const teacherEmails = req.query.teacher;
    const emails: string[] = Array.isArray(teacherEmails)
      ? (teacherEmails as string[])
      : typeof teacherEmails === "string"
      ? teacherEmails.split(",")
      : [];
    if (!emails || emails.length === 0) {
      return res.status(400).json({ error: "Missing teacher emails" });
    }
    const commonStudents = await TeacherBusinessService.getCommonStudents(
      emails
    );
    return res.status(200).json({ students: commonStudents });
  };

  // 3. Suspend Student
  public suspendStudent = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { student } = req.body as { student?: string };
    if (!student) {
      return res.status(400).json({ error: "No student email provided" });
    }
    const studentObj = await Student.findOne({ where: { email: student } });
    if (!studentObj) {
      return res.status(404).json({ error: "Student not found" });
    }
    const suspended = await TeacherBusinessService.suspenseStudent(studentObj);
    if (!suspended) {
      return res.status(404).json({ error: "Some Error Occurred" });
    }
    return res.status(204).json({ message: "Suspend Student Successfully!" });
  };

  // 4. Retrieve Notification Recipients
  public getStudentListThatRecieveNotifications = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { teacher, notification } = req.body as {
      teacher?: string;
      notification?: string;
    };
    if (!teacher || !notification) {
      return res.status(400).json({ error: "Missing teacher or notification" });
    }
    const finalRecipients =
      await TeacherBusinessService.getStudentsWhichRecievesNotifications(
        teacher,
        notification
      );
    return res.status(200).json({ recipients: finalRecipients });
  };
}

const teacherBuisinessController = new TeacherBusinessController();
export default teacherBuisinessController;
