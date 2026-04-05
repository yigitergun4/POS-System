import type { CartItem } from "../types/Product";
import type { Campaign } from "../types/Campaign";

export const applyCampaignsToCart = (
  cart: CartItem[],
  campaigns: Campaign[],
  paymentMethod: "cash" | "card" | "family" | "split"
) => {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const activeCampaigns = campaigns.filter((c) => {
    if (!c.isActive) return false;
    
    // Check Date
    if (c.endDate && c.endDate < today) return false;

    // Check Payment Method
    if (c.conditionPaymentMethod !== "ALL" && c.conditionPaymentMethod !== paymentMethod) return false;

    return true;
  });

  let newItems = cart.map((item) => {
    let finalItemPrice = item.price;
    const cat = (item.category || "").toLowerCase();
    const name = (item.name || "").toLowerCase();
    const barcode = item.barcode;

    for (const camp of activeCampaigns) {
      let isTarget = false;

      if (camp.targetType === "category") {
        const target = (camp.targetCategory || "").toLowerCase();
        if (cat.includes(target) || name.includes(target)) {
          isTarget = true;
        }
      } else if (camp.targetType === "products") {
        if (camp.targetBarcodes?.includes(barcode)) {
          isTarget = true;
        }
      }

      if (isTarget) {
        if (camp.effectType === "add_fee_per_item") {
          finalItemPrice += camp.effectValue;
        } else if (camp.effectType === "discount_per_item") {
          finalItemPrice -= camp.effectValue;
        } else if (camp.effectType === "percentage_discount") {
          finalItemPrice -= (finalItemPrice * camp.effectValue) / 100;
        }
        
        if (finalItemPrice < 0) finalItemPrice = 0;
      }
    }
    return { ...item, price: Math.round(finalItemPrice * 100) / 100 };
  });

  const total = newItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  return { updatedItems: newItems, total: Math.round(total * 100) / 100 };
};
