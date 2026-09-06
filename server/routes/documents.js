import express from 'express';
import multer from 'multer';
import { processPdfDocument, getDocument, deleteDocument } from '../services/documentService.js';
import { config } from '../config/ollamaConfig.js';

const router = express.Router();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file provided' });
    if (req.file.mimetype !== 'application/pdf') return res.status(400).json({ success: false, error: 'Unsupported file type. Only PDF is allowed.' });

    const documentInfo = await processPdfDocument(req.file.buffer, req.file.originalname);
    return res.json({ success: true, document: documentInfo });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to process document.' });
  }
});

router.post('/:id/ask', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ success: false, error: 'Question is required' });

    const doc = getDocument(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Document not found or expired' });

    const MAX_CONTEXT_LENGTH = 15000; 
    let contextText = '';
    let usedChunks = [];

    for (const chunk of doc.chunks) {
      if ((contextText.length + chunk.text.length) < MAX_CONTEXT_LENGTH) {
        contextText += chunk.text + '\n\n';
        usedChunks.push(chunk);
      } else break;
    }

    const sources = usedChunks.map(c => ({ pageStart: c.pageStart, pageEnd: c.pageEnd }));
    const systemPrompt = `You are DIA, a professional offline AI assistant. The user has provided a document named "${doc.fileName}". Answer using the document content as the primary source. Do not claim that the document is missing if extracted text is available. Do not invent information that is not present in the document. If the document does not contain enough information, clearly state that limitation. When useful, reference page numbers.

Document context:
${contextText}`;

    const payload = {
      model: config.DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ],
      stream: false,
      options: { temperature: 0.1, num_ctx: 4096 }
    };

    const ollamaRes = await fetch(`${config.OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!ollamaRes.ok) throw new Error('DIA could not connect to the local AI model.');

    const data = await ollamaRes.json();
    let answer = data.message?.content || '';
    answer = answer.replace(/<think>[\s\S]*?<\/think>\n*/g, '').trim();

    return res.json({ success: true, answer, sources });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Server failure' });
  }
});

router.post('/:id/summarize', async (req, res) => {
  try {
    const doc = getDocument(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });

    let contextText = doc.chunks.map(c => c.text).join('\n\n').substring(0, 15000);
    const systemPrompt = `You are DIA, a professional offline AI assistant. The user has provided a document named "${doc.fileName}". Answer using the document content as the primary source. Do not claim that the document is missing if extracted text is available. Do not invent information that is not present in the document.

Generate a comprehensive summary for this document using exactly this structure:
1. Document title or filename
2. Executive summary
3. Main topics
4. Important concepts
5. Key definitions or formulas, if present
6. Important conclusions
7. Exam-focused points, when appropriate
8. Optional follow-up suggestions

Document context:
${contextText}`;

    const payload = {
      model: config.DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: "Please summarize this document." }
      ],
      stream: false,
      options: { temperature: 0.2, num_ctx: 4096 }
    };

    const ollamaRes = await fetch(`${config.OLLAMA_URL}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!ollamaRes.ok) throw new Error('DIA could not connect to the local AI model.');
    
    const data = await ollamaRes.json();
    let answer = (data.message?.content || '').replace(/<think>[\s\S]*?<\/think>\n*/g, '').trim();
    return res.json({ success: true, answer });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// --------------------------------------------------
// Explain Document / Study Notes (Combined similar logic)
// --------------------------------------------------
router.post('/:id/:action', async (req, res) => {
  try {
    const docId = req.params.id;
    const action = req.params.action;
    
    if (action !== 'explain' && action !== 'study-notes') {
      return res.status(404).json({ success: false, error: 'Invalid action' });
    }

    const doc = getDocument(docId);
    if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });

    let contextText = doc.chunks.map(c => c.text).join('\n\n').substring(0, 15000);
    const isExplain = action === 'explain';
    
    const systemPrompt = isExplain 
      ? `Explain the document "${doc.fileName}" in simpler language while preserving the original meaning.`
      : `Generate study notes for "${doc.fileName}". Include definitions, key concepts, flashcards, and exam revision notes.`;

    const payload = {
      model: config.DEFAULT_MODEL,
      messages: [
        { role: 'system', content: `${systemPrompt}\n\nDocument context:\n${contextText}` },
        { role: 'user', content: isExplain ? "Explain this document." : "Create study notes." }
      ],
      stream: false,
      options: { temperature: 0.2, num_ctx: 4096 }
    };

    const ollamaRes = await fetch(`${config.OLLAMA_URL}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!ollamaRes.ok) throw new Error('DIA could not connect to the local AI model.');
    const data = await ollamaRes.json();
    let answer = (data.message?.content || '').replace(/<think>[\s\S]*?<\/think>\n*/g, '').trim();
    return res.json({ success: true, answer });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
