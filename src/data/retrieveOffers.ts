import { Offer } from "@/types/Offer";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy
} from "firebase/firestore";

export async function retrieveOffersFromDatabase(): Promise<Offer[]> {
  const db = getFirestore();
  const offersCol = collection(db, "offers");

  const q = query(
    offersCol,
    where("imageURL", "!=", null),
    orderBy("imageURL"),
    orderBy("createdAt", "desc"),
  );

  const snap = await getDocs(q);

  return snap.docs.map((doc) => {
    const d = doc.data();

    return {
      id: doc.id,
      name: d.name ?? "",
      title: d.title ?? "",
      description: d.description ?? "",
      city: d.city ?? "",
      area: typeof d.area === "number" ? d.area : Number(d.area ?? 0),
      price: typeof d.price === "number" ? d.price : Number(d.price ?? 0),
      currency: d.currency ?? "",
      imageURL: d.imageURL ?? "",
    } as Offer;
  });
}
