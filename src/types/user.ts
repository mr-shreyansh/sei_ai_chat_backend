import mongoose, { ObjectId } from "mongoose"


export type User = {
  _id: ObjectId;
  address: string;
  history: ObjectId; // Array of Chat objects when populated
};