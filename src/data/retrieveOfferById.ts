import { OffersId } from "@/types/OffersId";
import { doc, getDoc, getFirestore } from "firebase/firestore";

export async function retrieveOfferById(id: string): Promise<OffersId | null> {
  const db = getFirestore();
  const ref = doc(db, "offers", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const d = snap.data();

  return {
    id: snap.id,
    name: d.name ?? "",
    title: d.title ?? "",
    description: d.description ?? "",
    city: d.city ?? "",
    country: d.country,
    area: typeof d.area === "number" ? d.area : Number(d.area ?? 0),
    price: typeof d.price === "number" ? d.price : Number(d.price ?? 0),
    currency: d.currency ?? "",
    email: d.email ?? "",
    phone: d.phone ?? null,
    imageURL: d.imageURL ?? "",
    createdAt: d.createdAt ?? null,
    uid: d.uid
  };
}