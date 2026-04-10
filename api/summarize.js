// /api/summarize.js
import { HfInference } from '@huggingface/inference';

export default async function handler(req, res) {
    // 🔓 CORS headers (Still needed for browser requests)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { documentText } = req.body;
    if (!documentText) {
        return res.status(400).json({ error: 'Document text is required' });
    }

    try {
        // ✨ Initialize the SDK with your Hugging Face token
        const hf = new HfInference(process.env.HF_API_KEY);

        // ✨ Call the summarization method
        const result = await hf.summarization({
            model: 'facebook/bart-large-cnn',
            inputs: documentText.substring(0, 1024),
            parameters: {
                max_length: 250,
                min_length: 80,
                do_sample: false,
            },
        });

        res.status(200).json({ summary: result.summary_text });
    } catch (error) {
        console.error('Summarization error:', error);
        res.status(500).json({ error: error.message });
    }
}