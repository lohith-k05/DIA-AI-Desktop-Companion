import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Trash2, Loader, BookOpen, Lightbulb, FileSearch } from 'lucide-react';
import { chatService } from '../services/api';
import './DocumentsPage.css';

interface DocumentInfo {
  id: string;
  fileName: string;
  pageCount: number;
  uploadedAt: string;
}

export const DocumentsPage: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState<DocumentInfo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [askQuery, setAskQuery] = useState('');
  const [resultTitle, setResultTitle] = useState('');
  const [resultContent, setResultContent] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setErrorMsg('Only PDF files are supported.');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');
    setResultContent('');
    
    try {
      const res = await chatService.uploadDocument(file);
      if (res.success && res.document) {
        setActiveDoc(res.document);
      } else {
        setErrorMsg('Upload failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveDoc = () => {
    setActiveDoc(null);
    setResultContent('');
    setAskQuery('');
  };

  const runDocumentAction = async (action: 'summarize' | 'explain' | 'study-notes') => {
    if (!activeDoc) return;
    setIsProcessing(true);
    setErrorMsg('');
    setStatusMsg(`Running ${action}...`);
    setResultContent('');
    setResultTitle(action.toUpperCase());
    
    try {
      let res;
      if (action === 'summarize') res = await chatService.summarizeDocument(activeDoc.id);
      else if (action === 'explain') res = await chatService.explainDocument(activeDoc.id);
      else if (action === 'study-notes') res = await chatService.generateStudyNotes(activeDoc.id);

      if (res?.success) {
        setResultContent(res.answer);
      } else {
        throw new Error('Action failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Action failed');
    } finally {
      setIsProcessing(false);
      setStatusMsg('');
    }
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDoc || !askQuery.trim()) return;
    
    setIsProcessing(true);
    setErrorMsg('');
    setStatusMsg('Searching document...');
    setResultContent('');
    setResultTitle('ANSWER');

    try {
      const res = await chatService.askDocument(activeDoc.id, askQuery);
      if (res?.success) {
        let answer = res.answer;
        if (res.sources && res.sources.length > 0) {
          const pages = res.sources.map((s: any) => `${s.pageStart}-${s.pageEnd}`).join(', ');
          answer += `\n\n(Sources: Pages ${pages})`;
        }
        setResultContent(answer);
      } else {
        throw new Error('Failed to get answer');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to query document');
    } finally {
      setIsProcessing(false);
      setStatusMsg('');
    }
  };

  return (
    <div className="documents-page-root">
      <div className="documents-header">
        <h1>Document Intelligence</h1>
        <p>Upload PDFs to summarize, explain, or chat with your documents using DIA.</p>
      </div>

      {errorMsg && <div className="error-banner">{errorMsg}</div>}

      {!activeDoc ? (
        <>
          <div 
            className={`upload-zone ${isDragging ? 'dragging' : ''}`} 
            onClick={handleFileClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <UploadCloud size={48} className="upload-icon mx-auto" />
            <h3 className="upload-title">Click or drag a PDF file to upload</h3>
            <p className="upload-subtitle">Maximum file size: 50MB</p>
            {isUploading && (
              <div className="status-indicator" style={{justifyContent: 'center', marginTop: '16px'}}>
                <Loader size={16} className="spinner" />
                <span>Uploading & Extracting Text...</span>
              </div>
            )}
          </div>
          {/* Input moved completely outside the upload-zone to avoid bubbling/event blocks */}
          <input 
            type="file" 
            className="hidden-file-input" 
            ref={fileInputRef} 
            accept="application/pdf"
            onChange={handleFileChange}
          />
        </>
      ) : (
        <div className="document-card">
          <div className="doc-info-row">
            <div className="doc-title-group">
              <FileText size={32} className="doc-icon" />
              <div>
                <div className="doc-name">{activeDoc.fileName}</div>
                <div className="doc-meta">{activeDoc.pageCount} Pages • Uploaded just now</div>
              </div>
            </div>
            <button className="doc-remove-btn" onClick={handleRemoveDoc}>
              <Trash2 size={14} style={{display:'inline', marginRight: '4px'}}/> Remove
            </button>
          </div>

          <div className="doc-actions-grid">
            <button className="doc-action-btn" onClick={() => runDocumentAction('summarize')} disabled={isProcessing}>
              <BookOpen size={16} /> Summarize Document
            </button>
            <button className="doc-action-btn" onClick={() => runDocumentAction('explain')} disabled={isProcessing}>
              <Lightbulb size={16} /> Explain in Simple Terms
            </button>
            <button className="doc-action-btn" onClick={() => runDocumentAction('study-notes')} disabled={isProcessing}>
              <FileSearch size={16} /> Generate Study Notes
            </button>
          </div>

          <form className="doc-ask-box" onSubmit={handleAsk}>
            <input 
              type="text" 
              className="doc-ask-input" 
              placeholder="Ask a question about this document..." 
              value={askQuery}
              onChange={(e) => setAskQuery(e.target.value)}
              disabled={isProcessing}
            />
            <button type="submit" className="doc-ask-btn" disabled={isProcessing || !askQuery.trim()}>
              Ask
            </button>
          </form>

          {isProcessing && (
            <div className="status-indicator" style={{marginTop: '24px'}}>
              <Loader size={16} className="spinner" />
              <span>{statusMsg || 'Processing with local AI model...'}</span>
            </div>
          )}

          {resultContent && !isProcessing && (
            <div className="doc-result-box">
              <div className="doc-result-title">{resultTitle}</div>
              <div className="doc-result-content">{resultContent}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
