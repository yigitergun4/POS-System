import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCv22fJab6XcrivwkrqIrqTtBSsf0kRlYs",
  authDomain: "posystem-aec94.firebaseapp.com",
  projectId: "posystem-aec94",
  storageBucket: "posystem-aec94.firebasestorage.app",
  messagingSenderId: "1068943916639",
  appId: "1:1068943916639:web:7d86855001ad244d9265ea",
  measurementId: "G-9FN0772YQN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFirebase() {
  try {
    console.log("🔄 Firebase bağlantısı test ediliyor...");
    
    // Test data
    const testData = {
      "Yiyecek": 20,
      "İçecek": 20,
      "Bira": 24,
      "Ağır Alkol": 2,
      "Kuruyemişler": 5,
      "Diğer": 10,
    };
    
    // Write test data
    console.log("💾 Test verisi yazılıyor...");
    const stockRef = doc(db, "settings", "stockLevels");
    await setDoc(stockRef, testData);
    console.log("✅ Test verisi yazıldı");
    
    // Read test data
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
