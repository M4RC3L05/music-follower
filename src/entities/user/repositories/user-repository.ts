import { UserModel } from "#src/entities/user/models/user-model.js";

export class UserRepository {
  async getUser(id: string) {
    return UserModel.query().where({ id }).first();
  }
}

export const userRepository = new UserRepository();
