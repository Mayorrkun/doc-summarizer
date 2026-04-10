// /api/summarize.js
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { documentText } = req.body;
    if (!documentText) {
        return res.status(400).json({ error: 'Document text is required' });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
      You are an expert document analyst. Analyze the following document and create a concise summary.
      For EVERY MAJOR POINT in the document, provide a 3-5 line summary explaining it clearly.
      Format the output as a list of bullet points. Each bullet point should represent one major point and be 3-5 lines long.
      Do not include any introductory or concluding text. Start directly with the bullet points.
      
      Document content:
      ${documentText.substring(0, 30000)}
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ summary: text });
    } catch (error) {
        console.error('Gemini API error:', error);
        res.status(500).json({ error: 'Failed to generate summary' });
    }
}