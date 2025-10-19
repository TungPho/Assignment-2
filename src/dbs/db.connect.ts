import { Sequelize } from "sequelize";
import { Student, initStudentModel } from "../models/student";
import { Teacher, initTeacherModel } from "../models/teacher";
import { Registration, initRegistrationModel } from "../models/registration";

class Database {
  public static instance: Database;
  public sequelize: Sequelize;
  public Student: typeof Student;
  public Teacher: typeof Teacher;
  public Registration: typeof Registration;

  private constructor() {
    this.sequelize = new Sequelize(
      process.env.DB_NAME as string,
      process.env.DB_USER as string,
      process.env.DB_PASS as string,
      {
        host: process.env.DB_HOST,
        dialect: "mysql",
      }
    );

    // Khởi tạo các models (bằng class + init)
    this.Student = initStudentModel(this.sequelize);
    this.Teacher = initTeacherModel(this.sequelize);
    this.Registration = initRegistrationModel(this.sequelize);

    // Thiết lập quan hệ
    this.Teacher.belongsToMany(this.Student, { through: this.Registration });
    this.Student.belongsToMany(this.Teacher, { through: this.Registration });

    Database.instance = this;
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
}

export default Database;
