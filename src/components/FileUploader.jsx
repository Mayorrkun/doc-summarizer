import {useCallback, useState} from "react";
import {useDropzone} from "react-dropzone";
import * as pdfjslib from "pdfjs-dist";
import mammoth from "mammoth";

//Set pdf.js worker
pdfjslib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdfjs/${pdfjslib.version}/pdf.worker.min.js`;

        const FileUploader = ({onTextExtracted}) => {
        const [loading , setLoading] = useState(false);
        const [error, setError] = useState(null);

        const extractText = async (file) => {
            if(file.type === "application/pdf") {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjslib.getDocument({data:arrayBuffer}).promise;
                let fullText = '';
                for(let i = 1; i <= pdf.numPages; i++){
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    const pageText = content.items.map(item => item.str).join(' ');
                    fullText += pageText + '\n';
                }
                return fullText;
            }
            else if (file.name.endsWith('.docx')) {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                return result.value;
            } else {
                return await file.text();
            }
        };
            const onDrop = useCallback(async (acceptedFiles) => {
                const file = acceptedFiles[0];
                if (!file) return;
                setLoading(true);
                setError(null);
                try {
                    console.log('File:', file.name, file.type, file.size);
                    const text = await extractText(file);
                    console.log('Extracted text length:', text.length);
                    onTextExtracted(text);
                } catch (err) {
                    console.error('Extraction error:', err);  // <-- This is crucial
                    setError(`Could not read file: ${err.message || 'Unknown error'}`);
                } finally {
                    setLoading(false);
                }
            }, [onTextExtracted]);
        const { getRootProps, getInputProps, isDragActive } = useDropzone({
            onDrop,
            accept: {
                'application/pdf': ['.pdf'],
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                'text/plain': ['.txt']
            },
            maxFiles: 1
        });

        return(
            <div>
                <div
                    {...getRootProps()}
                    className={`dropzone ${isDragActive ? 'active' : ''}`}
                >
                    <input {...getInputProps()} />
                    {loading ? (
                        <p>📄 Reading document...</p>
                    ) : isDragActive ? (
                        <p>✨ Drop the file here...</p>
                    ) : (
                        <div>
                            <p>📁 Drag & drop a file here, or click to select</p>
                            <p className="hint">Supports PDF, DOCX, TXT</p>
                        </div>
                    )}
                </div>
                {error && <p className="error">{error}</p>}
            </div>
        )
    }

export default FileUploader;
