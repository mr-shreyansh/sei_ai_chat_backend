import mongoose, { ObjectId } from "mongoose"

export type User = {
    _id:ObjectId,
    name: string,
    address: string,
    email:string,
    mobile:number,
    following:mongoose.Schema.Types.ObjectId[],
    followers:mongoose.Schema.Types.ObjectId[],
    ownedPosts?:mongoose.Schema.Types.ObjectId[]
    boughtPosts?:mongoose.Schema.Types.ObjectId[]
}