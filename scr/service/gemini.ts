import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface TrendResult {
  title: string;
  snippet: string;
  link: string;
}

export interface KeywordAnalysis {
  keyword: string;
  relevance: number;
  intent: string;
  competition: "Low" | "Medium" | "High";
}

export interface ContentItem {
  day: string;
  title: string;
  description: string;
  platform: string;
  hashtags: string[];
}

export async function discoverTrends(niche: string) {
  const prompt = `Tìm kiếm các xu hướng mới nhất, tin tức nóng hổi và nội dung đang viral liên quan đến: "${niche}". Hãy tập trung vào những gì đang diễn ra trong 24-48 giờ qua.`;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text;
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  
  const sources = groundingChunks?.map(chunk => ({
    title: chunk.web?.title || "Nguồn tin",
    link: chunk.web?.uri || "#",
  })) || [];

  return { text, sources };
}

export async function analyzeKeywords(trendText: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: `Dựa trên nội dung xu hướng sau đây, hãy phân tích và trích xuất danh sách các từ khóa tiềm năng để SEO hoặc chạy quảng cáo. Trả về định dạng JSON.
    
    Nội dung: ${trendText}` }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            keyword: { type: Type.STRING },
            relevance: { type: Type.NUMBER, description: "Độ liên quan từ 0-100" },
            intent: { type: Type.STRING, description: "Ý định tìm kiếm: Thông tin, Giao dịch, Điều hướng" },
            competition: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
          },
          required: ["keyword", "relevance", "intent", "competition"],
        },
      },
    },
  });

  return JSON.parse(response.text) as KeywordAnalysis[];
}

export async function generateContentPlan(niche: string, keywords: KeywordAnalysis[]) {
  const keywordList = keywords.map(k => k.keyword).join(", ");
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: `Lập kế hoạch đăng bài trong 7 ngày cho chủ đề "${niche}" sử dụng các từ khóa: ${keywordList}. Kế hoạch nên bao gồm tiêu đề hấp dẫn, mô tả ngắn gọn, nền tảng phù hợp (Facebook, TikTok, LinkedIn...) và hashtag. Trả về định dạng JSON.` }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            platform: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["day", "title", "description", "platform", "hashtags"],
        },
      },
    },
  });

  return JSON.parse(response.text) as ContentItem[];
}
