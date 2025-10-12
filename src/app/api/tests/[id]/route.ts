import { NextResponse } from "next/server";
import { db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const ref = doc(db, "test", params.id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ id: snap.id, ...snap.data() });
}
