import mongoose, { ObjectId } from "mongoose"


export type User = {
  _id: ObjectId;
  address: string;
  history: ObjectId; // Array of Chat objects when populated
};

export type Transaction = {
  _id: ObjectId;
  user: ObjectId;
  hash: string;
  value: string;
  status: string;
  token: string;
  timestamp: string;
  gas: string;
  gasPrice: string;
  from: string;
  to: string;
  type: string;
  input: string;
  blockNumber: string;
  orderId?: string;
}