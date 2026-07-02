import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, SpendingPersona, BudgetRecommendation, FinancialHealth, Necessity, Sentiment } from "../types";

// STABLE MODEL: Primary production model.
const MODEL_NAME = "gemini-1.5-flash";

/**
 * Helper to get a fresh instance of the AI client.
 */
const getAI = () => {
    const apiKey = process.env.VITE_API_KEY;
    if (!apiKey || apiKey === "undefined" || apiKey === "") {
        console.warn("Gemini API Key is missing. AI features will be disabled.");
        return null;
    }
    return new GoogleGenAI({ apiKey });
};

export const categorizeTransaction = async (rawText: string, amount: number): Promise<Partial<Transaction>> => {
    try {
        const ai = getAI();
        if (!ai) throw new Error("Missing API Key");

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Analyze this transaction semantically: "${rawText}" for ₹${amount}.
      
      Classify into one of these CATEGORIES:
      - Food, Transportation, Entertainment, Shopping, Utilities, Groceries, Medical, Housing, Education, Personal Care, Travel, Investments
      
      Determine:
      1. Merchant name
      2. Primary category
      3. Specific sub-category
      4. Necessity: 'Need' vs 'Want' vs 'Savings' vs 'Debt'
      5. Sentiment: 'Positive' vs 'Neutral' vs 'Negative'
      
      Return valid JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        merchant: { type: Type.STRING },
                        category: { type: Type.STRING },
                        subCategory: { type: Type.STRING },
                        necessity: { type: Type.STRING, enum: ['Need', 'Want', 'Savings', 'Debt'] },
                        sentiment: { type: Type.STRING, enum: ['Positive', 'Neutral', 'Negative'] }
                    },
                    required: ["merchant", "category", "subCategory", "necessity", "sentiment"]
                }
            }
        });

        return JSON.parse(response.text || "{}");
    } catch (e) {
        console.error("AI Categorization failed:", e);
        return localClassify(rawText);
    }
};

const localClassify = (text: string): Partial<Transaction> => {
    return {
        merchant: text,
        category: "Uncategorized",
        subCategory: "General",
        necessity: Necessity.WANT,
        sentiment: Sentiment.NEUTRAL
    };
};

export const generatePersona = async (transactions: Transaction[]): Promise<SpendingPersona> => {
    try {
        const ai = getAI();
        if (!ai) throw new Error("Missing API Key");

        const summary = transactions.slice(-50).map(t => `${t.category} (₹${t.amount})`).join(", ");

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Based on these transactions: ${summary}. Assign a spending persona. Return JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        justification: { type: Type.STRING },
                        percentages: {
                            type: Type.OBJECT,
                            properties: {
                                needs: { type: Type.NUMBER },
                                wants: { type: Type.NUMBER },
                                savings: { type: Type.NUMBER }
                            },
                            required: ["needs", "wants", "savings"]
                        }
                    },
                    required: ["name", "justification", "percentages"]
                }
            }
        });

        return JSON.parse(response.text || "{}");
    } catch (e) {
        console.error("AI Persona generation failed:", e);
        return {
            name: "The Quiet Spender",
            justification: "PennyWise is observing your patterns.",
            percentages: { needs: 50, wants: 30, savings: 20 },
            analysisDate: new Date().toISOString()
        };
    }
};

export const talkToMoney = async (query: string, transactions: Transaction[]): Promise<string> => {
    try {
        const ai = getAI();
        if (!ai) return "I cannot analyze your data without an active API connection.";

        const recentTx = transactions.slice(0, 10).map(t => `${t.merchant}: ₹${t.amount}`).join("\n");

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `User asked: "${query}". Data: ${recentTx}. Be helpful.`
        });

        return response.text || "I'm having trouble connecting.";
    } catch (e) {
        console.error("AI Chat failed:", e);
        return "Something went wrong.";
    }
};

export const getFinancialHealthScore = async (transactions: Transaction[]): Promise<FinancialHealth> => {
    try {
        const ai = getAI();
        if (!ai) throw new Error("Missing API Key");

        const summary = transactions.slice(-20).map(t => `${t.amount} on ${t.category}`).join("; ");

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Analyze these transactions and provide a financial health score (0-100). Data: ${summary}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.INTEGER },
                        status: { type: Type.STRING, enum: ['Excellent', 'Stable', 'Critical'] },
                        tip: { type: Type.STRING }
                    },
                    required: ["score", "status", "tip"]
                }
            }
        });

        return JSON.parse(response.text || "{}");
    } catch (e) {
        return { score: 50, status: 'Stable', tip: 'AI service unavailable temporarily.' };
    }
};

export const getBudgetAdvice = async (transactions: Transaction[], persona: SpendingPersona | null): Promise<BudgetRecommendation[]> => {
    try {
        const ai = getAI();
        if (!ai) return [];

        const summary = transactions.slice(-30).map(t => `${t.category}: ₹${t.amount}`).join(", ");
        const personaContext = persona ? `User is a "${persona.name}".` : "";

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Analyze expenses: ${summary}. ${personaContext} Generate budget caps for top 3 categories.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            category: { type: Type.STRING },
                            currentSpend: { type: Type.NUMBER },
                            recommendedLimit: { type: Type.NUMBER },
                            reasoning: { type: Type.STRING },
                            actionableTip: { type: Type.STRING }
                        },
                        required: ["category", "currentSpend", "recommendedLimit", "reasoning", "actionableTip"]
                    }
                }
            }
        });

        return JSON.parse(response.text || "[]");
    } catch (e) {
        return [];
    }
};
