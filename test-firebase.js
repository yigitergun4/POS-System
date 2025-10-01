import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFirebase() {
  try {
    console.log("🔄 Firebase bağlantısı test ediliyor...");

    const testData = {
      Yiyecek: 20,
      İçecek: 20,
      Bira: 24,
      "Ağır Alkol": 2,
      Kuruyemişler: 5,
      Diğer: 10,
    };

    console.log("💾 Test verisi yazılıyor...");
    const stockRef = doc(db, "settings", "stockLevels");
    await setDoc(stockRef, testData);
    console.log("✅ Test verisi yazıldı");

    console.log("📖 Test verisi okunuyor...");
    const snapshot = await getDoc(stockRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      console.log("✅ Okunan veri:", data);
    } else {
      console.log("❌ Veri bulunamadı");
    }
  } catch (error) {
    console.error("❌ Firebase hatası:", error);
  }
}

testFirebase();
