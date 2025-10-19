import { Sequelize, DataTypes, Model, Optional } from "sequelize";
import { Student } from "./student";

export interface TeacherAttributes {
  email: string;
}
export interface TeacherCreationAttributes
  extends Optional<TeacherAttributes, never> {}

export class Teacher
  extends Model<TeacherAttributes, TeacherCreationAttributes>
  implements TeacherAttributes
{
  public email!: string;

  // Association property
  public Students?: Student[];

  // Association methods
  public addStudent!: (student: Student) => Promise<void>;
  public getStudents!: () => Promise<Student[]>;
  public setStudents!: (students: Student[]) => Promise<void>;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initTeacherModel(sequelize: Sequelize): typeof Teacher {
  Teacher.init(
    {
      email: { type: DataTypes.STRING, unique: true, allowNull: false },
    },
    {
      sequelize,
      tableName: "Teachers",
      modelName: "Teacher",
    }
  );
  return Teacher;
}
