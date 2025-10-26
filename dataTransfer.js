// migrateToPinecone.js
import "dotenv/config";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

// 1️⃣ Firestore başlat
initializeApp({
  credential: cert("./serviceAccount.json"),
});
const db = getFirestore();

// 2️⃣ Pinecone ve OpenAI başlat
const pinecone = new Pinecone({
  apiKey: process.env.VITE_PINECONE_API_KEY || "",
});
const index = pinecone.index("sales"); // küçük harf önemli!
const openai = new OpenAI({ apiKey: process.env.VITE_OPENAI_API_KEY || "" });

// 3️⃣ Metadata temizleme fonksiyonu
function sanitizeMetadata(rawData) {
  const safeMetadata = {};

  for (const [key, value] of Object.entries(rawData || {})) {
    if (value == null) continue;

    // timestamp -> ISO string
    if (typeof value === "object" && value._seconds) {
      safeMetadata[key] = new Date(value._seconds * 1000).toISOString();
    }
    // nested object -> string
    else if (typeof value === "object" && !Array.isArray(value)) {
      safeMetadata[key] = JSON.stringify(value);
    }
    // array of objects -> list of strings
    else if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === "object") {
        // Preserve important fields from objects in arrays (e.g., items with qty/price)
        const strList = value.map((v) => {
          const name = v?.name ?? v?.barcode ?? "?";
          const qty = v?.qty ?? 1;
          const price = v?.price ?? 0;
          const category = v?.category ?? "";
          return `${name}|qty=${qty}|price=${price}|cat=${category}`;
        });
        safeMetadata[key] = strList;
      } else {
        safeMetadata[key] = value;
      }
    }
    // primitive
    else {
      safeMetadata[key] = value;
    }
  }

  return safeMetadata;
}

// 4️⃣ OpenAI + Pinecone upsert
async function embedAndUpsert(docId, text, metadata, namespace) {
  try {
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    const safeMetadata = sanitizeMetadata(metadata);

    const vector = {
      id: docId,
      values: embedding.data[0].embedding, // ✅ float array
      metadata: safeMetadata, // ✅ güvenli metadata
    };

    await index.namespace(namespace).upsert([vector]);
    console.log(`✅ ${docId} Pinecone’a eklendi.`);
  } catch (err) {
    console.error(`❌ ${docId} eklenemedi:`, err.message);
  }
}

// 5️⃣ Sales koleksiyonunu aktar
async function migrateSales() {
  const snapshot = await db.collection("sales").get();
  console.log(`Toplam ${snapshot.size} satış bulunuyor...`);

  let count = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // 🔹 Ürünleri tüm formatlarda işle
    let itemDetails = [];
    let calculatedTotal = 0;

    if (Array.isArray(data.items)) {
      if (typeof data.items[0] === "string") {
        // 🔸 Eski format (sadece ürün isimleri)
        itemDetails = data.items.map((name) => `${name} x1 = ? TL`);
        calculatedTotal = data.total || 0;
      } else {
        // 🔸 Yeni format (nesneler)
        itemDetails = data.items.map((i) => {
          const name = i.name || "Bilinmeyen Ürün";
          const qty = i.qty || 1;
          const price = i.price || 0;
          const category = i.category || "";
          const subtotal = qty * price;
          calculatedTotal += subtotal;
          return `${name} (${category}) x${qty} = ${subtotal} TL`;
        });
      }
    } else if (Array.isArray(data.itemNames)) {
      // 🔸 itemNames fallback
      itemDetails = data.itemNames.map((name) => `${name} x1 = ? TL`);
      calculatedTotal = data.total || 0;
    }

    // 🔹 Eğer total eksikse hesapla
    const total = typeof data.total === "number" ? data.total : calculatedTotal;

    // 🔹 Embedding için metin (açıklayıcı)
    const text = `
Bu satış ${data.saleDay || "Bilinmeyen tarih"} tarihinde yapılmıştır.
Satılan ürünler:
${itemDetails.map((item) => `- ${item}`).join("\n")}
Toplam tutar: ${total} TL.
Ödeme yöntemi: ${data.paymentMethod || "Belirtilmemiş"}.
`.trim();

    // 🔹 Pinecone'a gönder
    await embedAndUpsert(doc.id, text, { ...data, total }, "sales_summaries");

    count++;
    if (count % 50 === 0) {
      console.log(`📦 ${count} satış işlendi, 1 sn bekleniyor...`);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log("✅ Tüm satışlar Pinecone’a aktarıldı!");
}

// 6️⃣ Çalıştır
(async () => {
  await migrateSales();
  console.log("🚀 Tüm yükleme tamamlandı.");
})();
