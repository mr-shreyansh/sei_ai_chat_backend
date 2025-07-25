import mongoose, { model, Schema, SchemaTimestampsConfig } from "mongoose";
import validator from "validator";
import { User } from "../../../types/user";

const userSchema = new Schema(
  {
    address: {
      type: String,
      required: true,
    },
    history: {
      type:Schema.Types.ObjectId,
      ref:'History'
    }
  },
  {
    timestamps: true,
  }
);

userSchema.index({ address: 1 }, { unique: true });

export type IUser = User & Document & SchemaTimestampsConfig;

export const UserData = model<IUser>("User", userSchema);
