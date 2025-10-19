import { Sequelize, DataTypes, Model, Optional } from "sequelize";

// 1. Nếu bạn không có trường nào trong Registration, có thể để interface rỗng:
export interface RegistrationAttributes {}

export interface RegistrationCreationAttributes
  extends Optional<RegistrationAttributes, never> {}

// 2. Định nghĩa class Registration kế thừa Model
export class Registration
  extends Model<RegistrationAttributes, RegistrationCreationAttributes>
  implements RegistrationAttributes {}

// 3. Hàm khởi tạo model
export function initRegistrationModel(
  sequelize: Sequelize
): typeof Registration {
  Registration.init(
    {}, // Nếu có trường, bổ sung vào đây
    {
      sequelize,
      tableName: "Registrations",
      modelName: "Registration",
      timestamps: false, // Nếu không dùng createdAt/updatedAt
    }
  );
  return Registration;
}
