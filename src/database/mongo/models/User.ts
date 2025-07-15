import mongoose, { model, Schema, SchemaTimestampsConfig } from "mongoose";
import validator from 'validator'
import { User } from "../../../types/user";

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        mobile: {
            type: Number,
        },
        email: {
            type: String,
            lowercase: true,
            validate: [validator.isEmail, 'Email is invalid']
        },
        ownedPosts: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post'
        }],
        boughtPosts: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post'
        }],
        posts: [{
            type: mongoose.Schema.Types.ObjectId,
            ref:'Post'
        }],
        followers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref:'User'
            }
        ],
        following: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref:'User'
            }
        ]
    },
    {
        timestamps: true,
    }
)

userSchema.index({ email: 1 })
userSchema.index({ name: 'text' }, { sparse: true })
userSchema.index({ address: 1, }, { unique: true })

export type IUser = User & Document & SchemaTimestampsConfig


export const UserData = model<IUser>('User', userSchema)