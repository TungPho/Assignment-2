import { Op } from 'sequelize';

// Mock the database module
jest.mock('../src/dbs/db.connect', () => {
  // Create mock functions placeholders; chúng ta có thể override implementation trong từng test
  const Student = {
    findAll: jest.fn(),
    findOrCreate: jest.fn(),
  };
  const Teacher = {
    findAll: jest.fn(),
    findOrCreate: jest.fn(),
    findOne: jest.fn(),
  };
  const Registration = {
    findAll: jest.fn(),
  };

  return {
    getInstance: () => ({ Student, Teacher, Registration }),
  };
});

import dbModule from '../src/dbs/db.connect';
import TeacherBusinessService from '../src/services/teacher.service';

const db = dbModule.getInstance();

// Type definitions for mocked data
interface MockStudent {
  email: string;
  suspended: boolean;
  save?: jest.Mock;
}

interface MockTeacher {
  email: string;
  Students?: MockStudent[];
  addStudent?: jest.Mock;
}

interface MockRegistration {
  id: number;
}

describe('TeacherBusinessService - Unit tests', () => {
  beforeEach(() => {
    // Reset tất cả mock trước mỗi test
    jest.clearAllMocks();
  });

  describe('getAllStudents', () => {
    it('should return array of { email, suspended }', async () => {
      const mockStudents: MockStudent[] = [
        { email: 'a@mail.com', suspended: false },
        { email: 'b@mail.com', suspended: true },
      ];
      (db.Student.findAll as jest.Mock).mockResolvedValue(mockStudents);

      const result = await TeacherBusinessService.getAllStudents();

      expect(db.Student.findAll).toHaveBeenCalledWith({
        attributes: ['email', 'suspended'],
      });
      expect(result).toEqual([
        { email: 'a@mail.com', suspended: false },
        { email: 'b@mail.com', suspended: true },
      ]);
    });
  });

  describe('getAllTeachers', () => {
    it('should return array of { email }', async () => {
      const mockTeachers: Pick<MockTeacher, 'email'>[] = [
        { email: 't1@mail.com' },
        { email: 't2@mail.com' },
      ];
      (db.Teacher.findAll as jest.Mock).mockResolvedValue(mockTeachers);

      const result = await TeacherBusinessService.getAllTeachers();

      expect(db.Teacher.findAll).toHaveBeenCalledWith({
        attributes: ['email'],
      });
      expect(result).toEqual([
        { email: 't1@mail.com' },
        { email: 't2@mail.com' },
      ]);
    });
  });

  describe('getAllRegistrations', () => {
    it('should return registrations as-is', async () => {
      const mockRegs: MockRegistration[] = [{ id: 1 }, { id: 2 }];
      (db.Registration.findAll as jest.Mock).mockResolvedValue(mockRegs);

      const result = await TeacherBusinessService.getAllRegistrations();

      expect(db.Registration.findAll).toHaveBeenCalled();
      expect(result).toBe(mockRegs);
    });
  });

  describe('registerStudentForTeacher', () => {
    it('should create/find teacher and students and addStudent for each student', async () => {
      const mockTeacherObj: MockTeacher & { addStudent: jest.Mock } = {
        email: 't@mail.com',
        addStudent: jest.fn(),
      };
      // findOrCreate for Teacher returns [teacherObj, created?], service expects [teacherObj]
      (db.Teacher.findOrCreate as jest.Mock).mockResolvedValue([mockTeacherObj]);
      (db.Student.findOrCreate as jest.Mock).mockResolvedValue([
        { email: 'stu@mail.com' },
      ]);

      const result = await TeacherBusinessService.registerStudentForTeacher(
        't@mail.com',
        ['stu@mail.com']
      );

      expect(db.Teacher.findOrCreate).toHaveBeenCalledWith({
        where: { email: 't@mail.com' },
      });
      expect(db.Student.findOrCreate).toHaveBeenCalledWith({
        where: { email: 'stu@mail.com' },
      });
      expect(mockTeacherObj.addStudent).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ message: 'Register Successfully!' });
    });

    it('should handle multiple students (call addStudent for each)', async () => {
      const mockTeacherObj = { addStudent: jest.fn() };
      (db.Teacher.findOrCreate as jest.Mock).mockResolvedValue([mockTeacherObj]);
      // make student.findOrCreate return different student each call
      (db.Student.findOrCreate as jest.Mock)
        .mockResolvedValueOnce([{ email: 'a@mail.com' }])
        .mockResolvedValueOnce([{ email: 'b@mail.com' }]);

      const result = await TeacherBusinessService.registerStudentForTeacher(
        't2@mail.com',
        ['a@mail.com', 'b@mail.com']
      );

      expect(db.Student.findOrCreate).toHaveBeenCalledTimes(2);
      expect(mockTeacherObj.addStudent).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ message: 'Register Successfully!' });
    });
  });

  describe('getCommonStudents', () => {
    it('should return intersection of students\' emails across teachers', async () => {
      const teacherA: MockTeacher = {
        email: 'ta@mail.com',
        Students: [
          { email: 'a@mail.com', suspended: false },
          { email: 'b@mail.com', suspended: false },
        ],
      };
      const teacherB: MockTeacher = {
        email: 'tb@mail.com',
        Students: [
          { email: 'b@mail.com', suspended: false },
          { email: 'c@mail.com', suspended: false },
        ],
      };
      (db.Teacher.findAll as jest.Mock).mockResolvedValue([teacherA, teacherB]);

      const result = await TeacherBusinessService.getCommonStudents([
        'ta@mail.com',
        'tb@mail.com',
      ]);

      expect(db.Teacher.findAll).toHaveBeenCalledWith({
        where: { email: ['ta@mail.com', 'tb@mail.com'] },
        include: 'Students',
      });
      expect(result).toEqual(['b@mail.com']);
    });

    it('should handle single teacher case (return all that teacher has)', async () => {
      const teacherA: MockTeacher = {
        email: 'ta@mail.com',
        Students: [{ email: 'x@mail.com', suspended: false }],
      };
      (db.Teacher.findAll as jest.Mock).mockResolvedValue([teacherA]);

      const result = await TeacherBusinessService.getCommonStudents([
        'ta@mail.com',
      ]);
      expect(result).toEqual(['x@mail.com']);
    });
  });

  describe('suspenseStudent', () => {
    it('should set suspended true and save', async () => {
      const saveMock = jest.fn().mockResolvedValue(true);
      const studentObj: MockStudent = {
        email: 'student@mail.com',
        suspended: false,
        save: saveMock,
      };

      const res = await TeacherBusinessService.suspenseStudent(studentObj);

      expect(studentObj.suspended).toBe(true);
      expect(saveMock).toHaveBeenCalled();
      expect(res).toBe(true);
    });
  });

  describe('getStudentsWhichRecievesNotifications', () => {
    it('should return registered students when teacher has registered students and no mentions', async () => {
      const teacherObj: MockTeacher = {
        email: 't@mail.com',
        Students: [
          { email: 'r1@mail.com', suspended: false },
          { email: 'r2@mail.com', suspended: false },
        ],
      };
      (db.Teacher.findOne as jest.Mock).mockResolvedValue(teacherObj);
      // Student.findAll should not be called because no mention emails
      (db.Student.findAll as jest.Mock).mockResolvedValue([]);

      const result =
        await TeacherBusinessService.getStudentsWhichRecievesNotifications(
          't@mail.com',
          'Hello students'
        );

      expect(db.Teacher.findOne).toHaveBeenCalled();
      expect(result.sort()).toEqual(['r1@mail.com', 'r2@mail.com'].sort());
    });

    it('should return mentioned students when teacher has none', async () => {
      (db.Teacher.findOne as jest.Mock).mockResolvedValue(null);
      // simulate Student.findAll returning mentioned students
      (db.Student.findAll as jest.Mock).mockResolvedValue([
        { email: 'm1@mail.com', suspended: false },
        { email: 'm2@mail.com', suspended: false },
      ]);

      const result =
        await TeacherBusinessService.getStudentsWhichRecievesNotifications(
          'missing@mail.com',
          'Hi @m1@mail.com and @m2@mail.com'
        );

      expect(db.Student.findAll).toHaveBeenCalled();
      expect(result.sort()).toEqual(['m1@mail.com', 'm2@mail.com'].sort());
    });

    it('should combine registered and mentioned students and remove duplicates', async () => {
      const teacherObj: MockTeacher = {
        email: 't@mail.com',
        Students: [
          { email: 'r1@mail.com', suspended: false },
          { email: 'm1@mail.com', suspended: false },
        ],
      };
      (db.Teacher.findOne as jest.Mock).mockResolvedValue(teacherObj);
      (db.Student.findAll as jest.Mock).mockResolvedValue([
        { email: 'm1@mail.com', suspended: false },
        { email: 'm2@mail.com', suspended: false },
      ]);

      const result =
        await TeacherBusinessService.getStudentsWhichRecievesNotifications(
          't@mail.com',
          'Notice to @m1@mail.com and @m2@mail.com'
        );

      // final recipients should be unique
      expect(result.sort()).toEqual(
        ['r1@mail.com', 'm1@mail.com', 'm2@mail.com'].sort()
      );
    });

    it('should ignore suspended mentioned students because query filters suspended:false (mock ensures only non-suspended returned)', async () => {
      // even if notification mentions suspended email, Student.findAll mock should return only non-suspended ones
      (db.Teacher.findOne as jest.Mock).mockResolvedValue(null);
      (db.Student.findAll as jest.Mock).mockResolvedValue([
        { email: 'active@mail.com', suspended: false },
      ]);

      const result =
        await TeacherBusinessService.getStudentsWhichRecievesNotifications(
          't@mail.com',
          'Hello @suspended@mail.com and @active@mail.com'
        );

      expect(result).toEqual(['active@mail.com']);
    });
  });
});