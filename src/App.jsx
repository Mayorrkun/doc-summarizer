import { useState } from 'react';
import FileUploader from './components/FileUploader';
import Summarizer from './components/Summarizer';
import './App.css';

function App() {
    const [extractedText, setExtractedText] = useState('');

    return (
        <div className="app">
            <header>
                <h1>📄 Document Summarizer</h1>
                <p>Upload a PDF, Word, or text file and get AI-powered key point summaries</p>
            </header>
            <main>
                <div className="card">
                    <FileUploader onTextExtracted={setExtractedText} />
                </div>
                {extractedText && (
                    <div className="card">
                        <Summarizer documentText={extractedText} />
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;