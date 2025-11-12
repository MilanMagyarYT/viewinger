import { Timestamp } from "firebase/firestore";

export type OffersId = {
  id: string;
  uid: string; // 👈 link to user’s Firestore profile
  name: string;
  title: string;
  description: string;
  city: string;
  country: string;
  area: number;
  price: number;
  currency: string;
  email: string;
  phone: string | null;
  imageURL: string | null;
  createdAt: Timestamp;
};
