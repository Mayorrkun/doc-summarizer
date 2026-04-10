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
        // Parse the request body
        const body = await parseBody(req);
        const { documentText } = body;   // <-- MAKE SURE THIS LINE EXISTS

        if (!documentText) {
            return res.status(400).json({ error: 'Document text is required' });
        }

        // Construct the input with instructions
        const inputText = `Provide a detailed bullet-point summary of the following document. Each bullet should be a 3-5 line explanation of a major point. Use "•" for bullets.\n\nDocument:\n${documentText.substring(0, 1024)}`;

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
                    inputs: inputText,
                    parameters: {
                        max_length: 400,
                        min_length: 150,
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
        let summaryText = data[0]?.summary_text || "No summary generated.";

        // Convert to bullet points if not already
        if (!summaryText.includes('•')) {
            const sentences = summaryText.match(/[^\.!\?]+[\.!\?]+/g) || [summaryText];
            summaryText = sentences.map(s => `• ${s.trim()}`).join('\n\n');
        }

        res.status(200).json({ summary: summaryText });
    } catch (error) {
        console.error('Summarization error:', error);
        res.status(500).json({ error: error.message });
    }
}