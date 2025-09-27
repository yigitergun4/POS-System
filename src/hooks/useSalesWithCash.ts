import { app } from "../lib/firebase";
import {
  getFirestore,
  collection,
  addDoc,
  CollectionReference,
  type DocumentData,
  DocumentReference,
  updateDoc,
} from "firebase/firestore";
import type { CartItem } from "../types/Product";

const db = getFirestore(app);

export const useSalesWithCash: () => {
  handleSalesWithCash: (total: number, cart: CartItem[]) => Promise<string>;
} = () => {
  const handleSalesWithCash: (
    total: number,
    cart: CartItem[]
  ) => Promise<string> = async (total: number, cart: CartItem[]) => {
    const salesRef: CollectionReference<DocumentData> = collection(db, "sales");
    const docRef: DocumentReference<DocumentData> = await addDoc(salesRef, {
      total: total,
      createdAt: new Date(),
      cart: cart,
    });
    await updateDoc(docRef, { id: docRef.id });
    await updateDoc(docRef, { total: total });
    await updateDoc(docRef, { createdAt: new Date() });
    await updateDoc(docRef, { cart: cart });
    await updateDoc(docRef, { status: "pending" });
    await updateDoc(docRef, { paymentMethod: "cash" });
    await updateDoc(docRef, { paymentStatus: "pending" });
    await updateDoc(docRef, { paymentDate: new Date() });
    await updateDoc(docRef, { paymentAmount: total });
    await updateDoc(docRef, { paymentMethod: "cash" });
    return docRef.id;
  };

  return { handleSalesWithCash };
};
