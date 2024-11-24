import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

// Hàm thêm sách vào Firestore
export async function addBook(book) {
  try {
    const docRef = await addDoc(collection(db, "books"), book);
    console.log("Sách đã được thêm với ID: ", docRef.id);
  } catch (e) {
    console.error("Lỗi khi thêm sách: ", e);
  }
}
