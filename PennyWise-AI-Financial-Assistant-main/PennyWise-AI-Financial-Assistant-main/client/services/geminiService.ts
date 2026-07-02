import { Transaction, SpendingPersona } from "../types";

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003/api';

export const categorizeTransaction = async (rawText: string, amount: number): Promise<Partial<Transaction>> => {
    try {
        const response = await fetch(`${API_URL}/categorize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rawText, amount })
        });
        if (!response.ok) throw new Error('Failed to categorize');
        return await response.json();
    } catch (error) {
        console.error('Categorize error:', error);
        return {
            category: 'Uncategorized',
            subCategory: 'General',
            merchant: rawText
        };
    }
};

export const generatePersona = async (transactions: Transaction[]): Promise<SpendingPersona> => {
    try {
        const response = await fetch(`${API_URL}/persona`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactions })
        });
        if (!response.ok) throw new Error('Failed to generate persona');
        return await response.json();
    } catch (error) {
        console.error('Persona error:', error);
        return {
            name: "The Quiet Spender",
            justification: "PennyWise is observing your patterns.",
            percentages: { needs: 50, wants: 30, savings: 20 },
            analysisDate: new Date().toISOString()
        };
    }
};

export const chatWithMoney = async (query: string, transactions: Transaction[]): Promise<string> => {
    try {
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, transactions })
        });
        if (!response.ok) throw new Error('Failed to chat');
        const data = await response.json();
        return data.text;
    } catch (error) {
        console.error('Chat error:', error);
        return "I'm having trouble connecting to my brain right now.";
    }
};

export const talkToMoney = chatWithMoney;
export const getSpendingPersona = generatePersona;

export const getFinancialHealthScore = async (transactions: Transaction[]) => {
    try {
        const response = await fetch(`${API_URL}/health-score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactions })
        });
        if (!response.ok) throw new Error('Failed to get health score');
        return await response.json();
    } catch (error) {
        return { score: 50, status: 'Stable', tip: 'Keep tracking your expenses!' };
    }
};

export const getBudgetAdvice = async (transactions: Transaction[], persona: SpendingPersona | null) => {
    try {
        const response = await fetch(`${API_URL}/budget-advice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactions, persona })
        });
        if (!response.ok) throw new Error('Failed to get budget advice');
        return await response.json();
    } catch (error) {
        return [];
    }
};
