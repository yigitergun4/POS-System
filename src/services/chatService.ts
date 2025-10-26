import { db } from "../lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { CHAT_CONFIG } from "../config/chatConfig";
import type { Sale } from "../types/Sale";
import type { CartItem } from "../types/Product";

interface ChatRequest {
  question: string;
  today: string;
}

interface ChatResponse {
  content: string;
  timestamp?: string;
  status?: string;
}

class ChatService {
  private webhookUrl: string;
  private config: typeof CHAT_CONFIG;

  constructor(config: typeof CHAT_CONFIG) {
    this.config = config;
    this.webhookUrl = config.WEBHOOK_URL;
  }

  /**
   * Firebase'den satış verilerini çeker
   */
  async getSalesData(): Promise<Sale[]> {
    try {
      const salesQuery = query(
        collection(db, "sales"),
        orderBy("timestamp", "desc")
      );
      const salesSnapshot = await getDocs(salesQuery);
      const sales: Sale[] = salesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Sale, "id">),
      }));
      return sales;
    } catch (error) {
      console.error("Satış verileri alınamadı:", error);
      return [];
    }
  }

  /**
   * Firebase'den ürün verilerini çeker
   */
  async getProductsData(): Promise<CartItem[]> {
    try {
      const productsQuery = query(collection(db, "products"));
      const productsSnapshot = await getDocs(productsQuery);
      const products: CartItem[] = productsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<CartItem, "id">),
      }));
      return products;
    } catch (error) {
      console.error("Ürün verileri alınamadı:", error);
      return [];
    }
  }

  /**
   * n8n webhook'una chat isteği gönderir
   */
  async sendChatRequest(question: string): Promise<ChatResponse> {
    try {
      const today: string = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Istanbul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());

      const requestData: ChatRequest & { today: string } = {
        question,
        today,
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      console.log(apiKey);
      if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`; // only if provided

      const response: Response = await fetch(this.webhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        let details = "";
        try {
          const text = await response.text();
          details = text?.slice(0, 500);
        } catch {}
        throw new Error(
          `HTTP ${response.status} ${response.statusText}${details ? `: ${details}` : ""}`
        );
      }

      // Try JSON first, fall back to text
      let data: any;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: { content: text } };
      }

      return {
        content: data?.message?.content || "Yanıt alınamadı.",
        timestamp: new Date().toISOString(),
        status: "success",
      };
    } catch (error: any) {
      console.error("Chat request failed:", error);
      throw new Error(error?.message || String(error));
    }
  }

  /**
   * Webhook URL'ini günceller
   */
  updateWebhookUrl(newUrl: string): void {
    this.webhookUrl = newUrl;
  }
}

// Singleton instance
const chatService = new ChatService(CHAT_CONFIG);

export default chatService;
export { ChatService, type ChatRequest, type ChatResponse };
