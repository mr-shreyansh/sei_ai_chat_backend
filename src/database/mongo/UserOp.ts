import { injectable } from "inversify";
import { User } from "../../types/user";
import { IUser, UserData } from "./models/User";
import { ObjectId } from "mongoose";

@injectable()
export class UserOp {

    constructor() {}

    async getUserById(id: string):Promise<User|null> {
        try{
            const result = await UserData.findOne({address: id as String}).lean()
            if(!result){
                return null
            }
            return this.transformUserData(result);
        }catch(err){
            throw new Error('Error in getting user Data')
        }
    }

    async getUsersByName(name:string, page:number = 1):Promise<User[]|null>{
        try{
            const batchSize = 10;
            const regextPattern = new RegExp(name, 'i');
            const result = await UserData.find({
                name: {$regex:regextPattern}
            })
            .lean()
            .skip((page-1) * batchSize)
            .limit(batchSize)
            .exec()

            return result.map((user:any)=> this.transformUserData(user))
        } catch(err){
            throw new Error('Error in searching users')
        }
    }

    async getAllUsers(page: number = 1):Promise<User[]>{
        const batchSize = 10;
        const users = await UserData.find().skip((page-1) * batchSize).lean().limit(batchSize).exec();
       return users.map((user)=>{
            return this.transformUserData(user);
        })
    }

    async updateUserData(userAddress:string,userData: Partial<User>): Promise<boolean> {
        try{
            await UserData.updateOne({address:userAddress},userData, {
                upsert:true,
            })
            return true;
        } catch(err){
            // console.log('error in registering the user',err)
            throw new Error('Error in registering the user')
        }
    }

    async updateFollowing(userA:string,userB:string): Promise<boolean> {
        try{

            const [currentUser, targetUser] = await Promise.all([
                UserData.findOne({address:userA}),
                UserData.findOne({address:userB})
            ])

            if(!currentUser || !targetUser){
                throw new Error('Error while updating Following list');
            }

            const isFollowing = await UserData.findOne({address:userA, following:targetUser._id});
            console.log('isFollowing',isFollowing)
            if (isFollowing) {
                // unfollow: remove targetUser from currentUser.following
                await UserData.updateOne(
                  { address: userA },
                  { $pull: { following: targetUser._id } }
                );
                // unfollow: remove currentUser from targetUser.followers
                await UserData.updateOne(
                  { address: userB },
                  { $pull: { followers: currentUser._id } }
                );
                return false;
              } else {
                // follow: add to currentUser.following
                await UserData.updateOne(
                  { address: userA },
                  { $addToSet: { following: targetUser._id } }
                );
                // follow: add to targetUser.followers
                await UserData.updateOne(
                  { address: userB },
                  { $addToSet: { followers: currentUser._id } }
                );
                return true;
              }        
        } catch(error){
            throw new Error(`Error while updating following ${error}`)
        }
    }

    transformUserData(userData: any): User {
        return {
            _id: userData?._id,
            address: userData.address,
            name: userData?.name,
            email: userData?.email,
            mobile: userData?.mobile,
            followers: userData?.followers,
            following: userData?.following
        }
    }
}