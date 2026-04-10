// /api/summarize.js

// Helper function to read and parse the request body
async function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                resolve(JSON.parse(body || '{}'));
            } catch (err) {
                reject(new Error('Invalid JSON body'));
            }
        });
        req.on('error', reject);
    });
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 🔧 Manually parse the request body
        const body = await parseBody(req);
        const { documentText } = body;

        if (!documentText) {
            return res.status(400).json({ error: 'Document text is required' });
        }

        // Call Hugging Face Inference API
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