import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini backend-side (secure)
const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });

app.post('/api/generate', async (req, res) => {
    try {
        const { prompt, selectedModel } = req.body;
        
        // Use confirmed available models for this specific API key
        const modelsToTry = selectedModel ? [selectedModel] : [
            'gemini-3.1-flash-live-preview',
            'gemini-2.5-flash',
            'gemini-2.5-pro',
            'gemini-2.0-flash',
            'gemini-2.0-flash-lite-001'
        ];
        
        let result = null;
        let lastError = "Unknown error";
        
        for (const modelName of modelsToTry) {
            try {
                result = await ai.models.generateContent({ model: modelName, contents: prompt });
                break;
            } catch (error) {
                lastError = error.message;
                console.warn(`Model ${modelName} failed:`, error.message);
            }
        }

        if (!result) throw new Error(`Google API Reject: ${lastError}`);

        let cleanJson = result.text.trim().replace(/^```json/g, '').replace(/```$/g, '').trim();
        const scheduleData = JSON.parse(cleanJson);
        res.json({ success: true, data: scheduleData, modelUsed: result.model });
    } catch (e) {
        console.error("AI Error:", e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// Serve frontend build if running in production
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend Server securely running on port ${PORT}`);
});
