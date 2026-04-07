import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface PKPrediction {
  predictedWinner: "Host" | "Challenger";
  confidence: string;
  reason: string;
}

export interface PKAssistantSuggestion {
  giftType: string;
  coins: number;
  message: string;
}

export interface ViewerAnalysis {
  viewerTypeSummary: string;
  persuasionTips: string;
  comebackAssessment: string;
}

export interface RematchRecommendation {
  recommendRematch: "Ndio" | "Hapana";
  reason: string;
  suggestedWaitTime: string;
}

export interface LeaderboardEntry {
  username: string;
  totalCoins: number;
  pkWins: number;
  specialAward: string;
}

export const aiService = {
  async predictWinner(data: {
    hostPoints: number;
    challengerPoints: number;
    timeLeft: number;
    giftHistory: string;
  }): Promise<PKPrediction> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Wewe ni mchambuzi wa PK Battle. Kulingana na data hii:
- Points za Host: ${data.hostPoints}
- Points za Challenger: ${data.challengerPoints}
- Muda uliosalia (sekunde): ${data.timeLeft}
- Historia ya zawadi za dakika 5 zilizopita: ${data.giftHistory}

Jibu kwa muundo wa JSON pekee:
{
  "predictedWinner": "Host/Challenger",
  "confidence": "percentage",
  "reason": "maelezo mafupi"
}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            predictedWinner: { type: Type.STRING },
            confidence: { type: Type.STRING },
            reason: { type: Type.STRING },
          },
          required: ["predictedWinner", "confidence", "reason"],
        },
      },
    });
    return JSON.parse(response.text || "{}");
  },

  async getPKAssistantSuggestion(data: {
    difference: number;
    timeLeft: number;
    winningSide: string;
  }): Promise<PKAssistantSuggestion> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Wewe ni msaidizi wa PK Battle. Tazama hali hii:
- Host anaongoza kwa ${data.difference} points
- Muda umebakia ${data.timeLeft} sekunde
- Watazamaji wanaotuma zawadi wengi ni wa upande wa ${data.winningSide}

Pendekeza:
1. Aina ya zawadi inayofaa kutuma sasa
2. Kiasi cha coins cha kupendekeza
3. Ujumbe wa kuwahamasisha watazamaji

Jibu kwa Kiswahili rahisi katika muundo wa JSON:
{
  "giftType": "aina ya zawadi",
  "coins": 100,
  "message": "ujumbe"
}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            giftType: { type: Type.STRING },
            coins: { type: Type.NUMBER },
            message: { type: Type.STRING },
          },
          required: ["giftType", "coins", "message"],
        },
      },
    });
    return JSON.parse(response.text || "{}");
  },

  async analyzeViewerBehavior(data: {
    totalCoins: number;
    highValueGiftersCount: number;
    sideSwitchersCount: number;
  }): Promise<ViewerAnalysis> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Chambua tabia ya watazamaji katika PK Battle hii:
- Watazamaji 50 wametuma jumla ya coins ${data.totalCoins}
- Watazamaji ${data.highValueGiftersCount} wametuma zawadi za bei ya juu
- Watazamaji ${data.sideSwitchersCount} wamebadilisha upande wao

Toa muhtasari wa:
- Aina ya watazamaji wengi (watoaji wakubwa, wadogo, au watazamaji tu)
- Pendekezo la jinsi ya kuwashawishi watoaji wakubwa
- Tathmini ya uwezekano wa comeback

Jibu kwa Kiswahili katika muundo wa JSON:
{
  "viewerTypeSummary": "muhtasari",
  "persuasionTips": "mapendekezo",
  "comebackAssessment": "tathmini"
}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            viewerTypeSummary: { type: Type.STRING },
            persuasionTips: { type: Type.STRING },
            comebackAssessment: { type: Type.STRING },
          },
          required: ["viewerTypeSummary", "persuasionTips", "comebackAssessment"],
        },
      },
    });
    return JSON.parse(response.text || "{}");
  },

  async recommendRematch(data: {
    winner: string;
    pointDifference: number;
    duration: string;
    bigGifts: number;
  }): Promise<RematchRecommendation> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Kulingana na matokeo ya PK hii:
- Mshindi: ${data.winner}
- Tofauti ya points: ${data.pointDifference}
- Muda wa PK: ${data.duration}
- Idadi ya zawadi kubwa: ${data.bigGifts}

Je, rematch inafaa kufanyika? Jibu kwa muundo wa JSON:
{
  "recommendRematch": "Ndio/Hapana",
  "reason": "maelezo",
  "suggestedWaitTime": "dakika ngapi kabla ya rematch"
}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendRematch: { type: Type.STRING },
            reason: { type: Type.STRING },
            suggestedWaitTime: { type: Type.STRING },
          },
          required: ["recommendRematch", "reason", "suggestedWaitTime"],
        },
      },
    });
    return JSON.parse(response.text || "{}");
  },

  async getRematchNotification(): Promise<string> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Tengeneza ujumbe mfupi wa kuwataarifu watazamaji kwamba rematch itaanza baada ya sekunde 30. Tumia lugha ya kusisimua na emoji. Jibu kwa Kiswahili.`,
    });
    return response.text || "";
  },

  async generateLeaderboard(leaderboardData: string): Promise<LeaderboardEntry[]> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Una data hii ya watoaji zawadi katika PK Battle zilizopita (siku 7):
${leaderboardData}

Tengeneza leaderboard mpya kwa:
1. Jina la mtumiaji
2. Jumla ya coins alizotuma
3. Idadi ya PK alizoshinda kama mtoaji mkuu
4. Tuzo maalum (kwa mfano "King Gifter", "Comeback King")

Panga kwa kushuka kwa coins. Toa kwa muundo wa JSON (array of objects).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              username: { type: Type.STRING },
              totalCoins: { type: Type.NUMBER },
              pkWins: { type: Type.NUMBER },
              specialAward: { type: Type.STRING },
            },
            required: ["username", "totalCoins", "pkWins", "specialAward"],
          },
        },
      },
    });
    return JSON.parse(response.text || "[]");
  },

  async getTopGifterCelebration(username: string, totalCoins: number): Promise<string> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Mtumiaji ${username} amekuwa mtoaji bora wa wiki hii kwa coins ${totalCoins}. Tengeneza ujumbe wa kumpongeza na kuwahimiza wengine. Tumia lugha ya kusisimua na emoji. Jibu kwa Kiswahili.`,
    });
    return response.text || "";
  },

  async shouldAutoStartPK(data: {
    viewerCount: number;
    newViewers: number;
    timeSinceLastPK: string;
    bigGiftersCount: number;
  }): Promise<{ decision: "auto-start" | "wait" | "no"; reason: string }> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Hali ya sasa ya live stream:
- Watazamaji walio hai: ${data.viewerCount}
- Watazamaji wapya walioingia dakika 1 iliyopita: ${data.newViewers}
- Muda tangu PK ya mwisho: ${data.timeSinceLastPK}
- Idadi ya watoaji wakubwa waliopo: ${data.bigGiftersCount}

Je, nianzishe PK moja kwa moja? Jibu kwa muundo wa JSON:
{
  "decision": "auto-start/wait/no",
  "reason": "sababu"
}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            decision: { type: Type.STRING },
            reason: { type: Type.STRING },
          },
          required: ["decision", "reason"],
        },
      },
    });
    return JSON.parse(response.text || "{}");
  },

  async getWelcomeMessage(count: number): Promise<string> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Watazamaji ${count} wapya wamejiunga na live. PK itaanza moja kwa moja baada ya sekunde 10. Andika ujumbe wa kuwakaribisha na kuwataarifu kuhusu PK inayokuja. Tumia Kiswahili, iwe fupi na yenye hamasa.`,
    });
    return response.text || "";
  },

  async getPeakHourRecommendations(data: {
    peakHours: string;
    peakDays: string;
    giftTypes: string;
  }): Promise<string[]> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Kwa kutumia data hii ya siku 7 zilizopita:
- Saa za wengi wakiwa hai: ${data.peakHours}
- Siku za wengi wakiwa hai: ${data.peakDays}
- Aina ya zawadi zinazotumwa wakati huo: ${data.giftTypes}

Nipe mapendekezo ya saa 3 bora za kuanzisha PK kwa wiki hii. Toa kwa muundo wa orodha rahisi (array of strings).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    });
    return JSON.parse(response.text || "[]");
  },
};
