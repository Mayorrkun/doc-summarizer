import { useState } from "react";

const Summarizer = ({ documentText }) => {
    const [summary, setSummary] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const generateSummary = async () => {
        setLoading(true);
        setError(null);

        const HF_TOKEN = import.meta.env.VITE_HF_API_KEY;

        try {
            const response = await fetch(
                "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${HF_TOKEN}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        inputs: documentText.substring(0, 1024), // BART works best with ~1024 tokens
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
                throw new Error(`API request failed: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            // Hugging Face returns an array with summary_text
            const summaryText = data[0]?.summary_text;
            if (!summaryText) {
                throw new Error("No summary returned from model");
            }

            // Format bullet points manually (BART returns a paragraph, we'll split later if needed)
            setSummary(summaryText);
        } catch (err) {
            setError(`Could not generate summary: ${err.message}`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="summarizer">
            <button
                onClick={generateSummary}
                disabled={loading || !documentText}
                className="summarize-btn"
            >
                {loading ? "🤔 Summarizing..." : "✨ Summarize Document"}
            </button>
            {error && <p className="error">{error}</p>}
            {summary && (
                <div className="summary-container">
                    <h2>📝 Key Points Summary</h2>
                    <div className="summary-content">
                        {/* BART returns a paragraph; we display as is */}
                        <p>{summary}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Summarizer;