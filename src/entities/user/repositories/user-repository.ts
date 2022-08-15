import { ModelObject } from "objection";

import { UserModel } from "#src/entities/user/models/user-model.js";

export class UserRepository {
  async getUser(id: number) {
    return UserModel.query().where({ id }).first();
  }

  async getUserByEmail(email: string) {
    return UserModel.query().where({ email }).first();
  }

  async updateUser(id: number, data: ModelObject<UserModel>) {
    return UserModel.query().update(data).where({ id });
  }
}

export const userRepository = new UserRepository();
