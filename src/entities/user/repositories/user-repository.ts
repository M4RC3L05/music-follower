import { ModelObject, raw } from "objection";

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

  async search({ limit = 10, page = 0, q }: { page: number; limit: number; q?: string }) {
    const query = UserModel.query().orderBy("username", "asc");

    if (q) {
      void query.where((qb) => {
        void qb
          .orWhere(raw('lower("email")'), "like", `%${q.toLowerCase()}%`)
          .orWhere(raw('lower("username")'), "like", `%${q.toLowerCase()}%`);
      });
    }

    return query.page(page, limit);
  }

  async deleteUser(id: number) {
    return UserModel.query().where({ id }).delete();
  }

  async createUser(data: Partial<ModelObject<UserModel>>) {
    return UserModel.query().insert(data);
  }
}

export const userRepository = new UserRepository();
