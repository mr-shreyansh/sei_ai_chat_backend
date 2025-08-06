import { inject, injectable } from "inversify";
import { TYPES } from "../ioc-container/types";
import { UserOp } from "../database/mongo/UserOp";
import { Chat } from "../types/history";
import { Transaction } from "../types/user";


@injectable()
export class UserService {
    constructor(
        @inject(TYPES.UserOp) private userOp:UserOp
    ){}

    async getUserInfo(address:string) {
        const user = await this.userOp.getUserHistory(address);
        return user;
    }

    async addUserHistory(address:string, chats:Chat[]) {
        const result = await this.userOp.updateUserHistory(address,chats);
        return result;
    }

    async addUserTransaction(address: string, transaction:Partial<Transaction>) {
        const result = await this.userOp.updateUserTransaction(address, transaction);
        return result;
    }

    async getUserTransactions(address:string) {
        const userTransactions = await this.userOp.getUserTransactions(address);
        return userTransactions;
    }


}