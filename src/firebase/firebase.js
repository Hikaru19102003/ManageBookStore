// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import Firestore
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage

// Cấu hình Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCbtowz8ZXDnz5BrBlpp6RJ9qZyGIDkrGU",
  authDomain: "managebookstore-58516.firebaseapp.com",
  projectId: "managebookstore-58516",
  storageBucket: "managebookstore-58516.appspot.com",
  messagingSenderId: "153378751880",
  appId: "1:153378751880:web:075742ebb51a580071a63d"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo Firebase Auth với AsyncStorage để lưu trạng thái đăng nhập
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firestore
export const db = getFirestore(app);
