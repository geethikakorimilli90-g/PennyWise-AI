import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as gemini from './services/geminiService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'PennyWise AI Backend is running' });
});

app.post('/api/categorize', async (req, res) => {
    try {
        const { rawText, amount } = req.body;
        const result = await gemini.categorizeTransaction(rawText, amount);
        res.json(result);
    } catch (error) {
        console.error('Categorize error:', error);
        res.status(500).json({ error: 'Failed to categorize' });
    }
});

app.post('/api/persona', async (req, res) => {
    try {
        const { transactions } = req.body;
        const result = await gemini.generatePersona(transactions);
        res.json(result);
    } catch (error) {
        console.error('Persona error:', error);
        res.status(500).json({ error: 'Failed to generate persona' });
    }
});

app.post('/api/chat', async (req, res) => {
    try {
        const { query, transactions } = req.body;
        const result = await gemini.talkToMoney(query, transactions);
        res.json({ text: result });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to chat' });
    }
});

app.post('/api/health-score', async (req, res) => {
    try {
        const { transactions } = req.body;
        const result = await gemini.getFinancialHealthScore(transactions);
        res.json(result);
    } catch (error) {
        console.error('Health score error:', error);
        res.status(500).json({ error: 'Failed to get health score' });
    }
});

app.post('/api/budget-advice', async (req, res) => {
    try {
        const { transactions, persona } = req.body;
        const result = await gemini.getBudgetAdvice(transactions, persona);
        res.json(result);
    } catch (error) {
        console.error('Budget advice error:', error);
        res.status(500).json({ error: 'Failed to get budget advice' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
