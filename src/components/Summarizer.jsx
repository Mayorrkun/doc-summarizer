import { useState } from 'react';

const Summarizer = ({ documentText }) => {
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const generateSummary = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentText })
            });
            if (!response.ok) throw new Error('Failed to generate summary');
            const data = await response.json();
            setSummary(data.summary);
        } catch (err) {
            setError('Could not generate summary. Please try again.');
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
                {loading ? '🤔 Summarizing...' : '✨ Summarize Document'}
            </button>
            {error && <p className="error">{error}</p>}
            {summary && (
                <div className="summary-container">
                    <h2>📝 Key Points Summary</h2>
                    <div className="summary-content">
                        {summary.split('\n').map((line, i) => (
                            line.trim() ? <p key={i}>{line}</p> : null
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Summarizer;