// /api/summarize.js
export default async function handler(req, res) {
    // 🔓 EXPLICIT CORS HEADERS - Must be set for ALL responses
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    // 🛑 Handle preflight OPTIONS request IMMEDIATELY
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
        const response = await fetch(
            "https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.HF_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    inputs: documentText.substring(0, 1024),
                    parameters: {
                        max_length: 250,
                        min_length: 80,
                        do_sample: false,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const summaryText = data[0]?.summary_text;

        if (!summaryText) {
            throw new Error("No summary returned from Hugging Face model.");
        }

        return res.status(200).json({ summary: summaryText });
    } catch (error) {
        console.error('Summarization error:', error);
        return res.status(500).json({ error: error.message });
    }
}