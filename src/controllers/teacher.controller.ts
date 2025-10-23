import { Request, Response } from "express";
import TeacherBusinessService from "../services/teacher.service";
import Database from "../dbs/db.connect";
import { ERROR_MESSAGES } from "../constants/error.messages";

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
      return res
        .status(500)
        .json({ error: ERROR_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR });
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
      return res
        .status(500)
        .json({ error: ERROR_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR });
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
      return res
        .status(500)
        .json({ error: ERROR_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR });
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
        return res
          .status(400)
          .json({ error: ERROR_MESSAGES.GENERAL.INVALID_PAYLOAD });
      }
      const message = await TeacherBusinessService.registerStudentForTeacher(
        teacher,
        students
      );
      return res.status(201).json({ message });
    } catch (error) {
      return res
        .status(500)
        .json({ message: ERROR_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR });
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
      return res
        .status(400)
        .json({ error: ERROR_MESSAGES.TEACHER.MISSING_EMAILS });
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
      return res
        .status(400)
        .json({ error: ERROR_MESSAGES.STUDENT.NO_EMAIL_PROVIDED });
    }
    const studentObj = await Student.findOne({ where: { email: student } });
    if (!studentObj) {
      return res.status(404).json({ error: ERROR_MESSAGES.STUDENT.NOT_FOUND });
    }
    const suspended = await TeacherBusinessService.suspenseStudent(studentObj);
    if (!suspended) {
      return res
        .status(404)
        .json({ error: ERROR_MESSAGES.GENERAL.SOME_ERROR_OCCURRED });
    }
    return res.status(204).json({
      message: ERROR_MESSAGES.GENERAL.MISSING_TEACHER_OR_NOTIFICATION,
    });
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
      return res.status(400).json({
        error: ERROR_MESSAGES.GENERAL.MISSING_TEACHER_OR_NOTIFICATION,
      });
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
