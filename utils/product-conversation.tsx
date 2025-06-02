import axios from "axios";

export interface ProductConversationResponse {
  slug: string;
  systemPrompt: string;
  questions: string[];
}

export async function generateProductConversation(
  productPrompt: string
): Promise<ProductConversationResponse | undefined> {
  try {
    const { data } = await axios.post<ProductConversationResponse>("/api/product-conversations/generate", {
      userPrompt: productPrompt,
    });
    
    return data;
  } catch (error) {
    console.error(error);
  }
}
