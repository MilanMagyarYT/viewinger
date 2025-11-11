import { Timestamp } from "firebase/firestore";

export type OffersId = {
  id: string;
  name: string;
  title: string;
  description: string;
  city: string;
  area: number;
  price: number;
  currency: string;
  email: string;
  phone: string;
  imageURL: string;
  createdAt: Timestamp;
};