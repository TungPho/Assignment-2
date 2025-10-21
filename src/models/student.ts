import { Sequelize, DataTypes, Model, Optional } from "sequelize";

// 1. Định nghĩa interface cho thuộc tính
export interface StudentAttributes {
  email: string;
  suspended: boolean;
}

// 2. Định nghĩa interface cho thuộc tính khi tạo mới (có thể thiếu một số trường)
export interface StudentCreationAttributes
  extends Optional<StudentAttributes, "suspended"> {}

// 3. Định nghĩa class kế thừa Model
export class Student
  extends Model<StudentAttributes, StudentCreationAttributes>
  implements StudentAttributes
{
  public email!: string;
  public suspended!: boolean;

  // Tùy chọn: timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initStudentModel(sequelize: Sequelize): typeof Student {
  Student.init(
    {
      email: { type: DataTypes.STRING, unique: true, allowNull: false },
      suspended: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      sequelize,
      tableName: "Students",
      modelName: "Student",
      timestamps: true, // Nếu bạn muốn dùng createdAt/updatedAt
    }
  );
  return Student;
}
