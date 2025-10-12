import { NextResponse } from "next/server";
import { db } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";

export async function GET() {
  const snap = await getDocs(collection(db, "test"));
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return NextResponse.json(items);
}
