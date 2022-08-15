import { Model } from "objection";

export class UserModel extends Model {
  static tableName = "users";

  id!: number;
  username!: string;
  email!: string;
  password!: string;
  role!: "admin" | "user";
}
