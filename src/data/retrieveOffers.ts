// src/utils/retrieveOffersFromDatabase.ts

import { Offer } from "@/types/Offer";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";

export async function retrieveOffersFromDatabase(
  city?: string,
  country?: string
): Promise<Offer[]> {
  const db = getFirestore();
  const offersCol = collection(db, "offers");

  // --- Build query dynamically ---
  const constraints: any[] = [
    where("imageURL", "!=", null),
    orderBy("imageURL"),
    orderBy("createdAt", "desc"),
  ];

  if (city) constraints.push(where("city", "==", city));
  if (country) constraints.push(where("country", "==", country));

  const q = query(offersCol, ...constraints);
  const snap = await getDocs(q);

  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      name: d.name ?? "",
      title: d.title ?? "",
      description: d.description ?? "",
      city: d.city ?? "",
      country: d.country ?? "",
      area: typeof d.area === "number" ? d.area : Number(d.area ?? 0),
      price: typeof d.price === "number" ? d.price : Number(d.price ?? 0),
      currency: d.currency ?? "",
      imageURL: d.imageURL ?? "",
    } as Offer;
  });
}
