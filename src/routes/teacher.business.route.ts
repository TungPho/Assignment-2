import { Router, Request, Response, NextFunction } from "express";
import teacherBuisinessController from "../controllers/teacher.controller";

const router: Router = Router();

// GET all students
router.get("/students", teacherBuisinessController.getAllStudents);

// GET all teachers
router.get("/teachers", teacherBuisinessController.getAllTeachers);

// GET all registrations
router.get("/registrations", teacherBuisinessController.getAllRegistraions);

// 1. Register students to teacher
router.post("/register", teacherBuisinessController.registerStudentForTeacher);

// 2. Get common students
router.get("/commonstudents", teacherBuisinessController.getCommonStudents);

// 3. Suspend student
router.post("/suspend", teacherBuisinessController.suspendStudent);

// 4. Retrieve notification recipients
router.post(
  "/retrievefornotifications",
  teacherBuisinessController.getStudentListThatRecieveNotifications
);

export default router;
