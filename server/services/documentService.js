import crypto from 'crypto';

// Dynamically import pdfjs-dist legacy build for Node environments
const initPdfJs = async () => {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  return pdfjsLib;
};

// In-memory document store for prototype
const documentStore = new Map();

/**
 * Validates the file buffer and parses the PDF text.
 */
export const processPdfDocument = async (fileBuffer, originalName) => {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('Empty file received');
  }

  const pdfjsLib = await initPdfJs();
  const data = new Uint8Array(fileBuffer);

  const loadingTask = pdfjsLib.getDocument({ data });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  let pages = [];
  
  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const textItems = textContent.items.map(item => item.str).join(' ');
    
    let cleanedText = textItems
      .replace(/\r\n/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanedText.length > 0) {
      pages.push({
        pageNumber: i,
        text: cleanedText
      });
    }
  }

  if (pages.length === 0) {
    throw new Error('This PDF appears to contain scanned pages or images without selectable text. Text extraction was unsuccessful. OCR support is required to analyze this document.');
  }

  const fullCleanText = pages.map(p => p.text).join('\n\n');

  // Chunking Strategy
  const chunks = chunkDocumentText(pages, 1000, 150);

  const documentId = crypto.randomUUID();
  
  const documentInfo = {
    id: documentId,
    fileName: originalName,
    pageCount: numPages,
    pages,
    fullText: fullCleanText,
    chunks,
    uploadedAt: new Date().toISOString(),
    status: 'ready'
  };

  documentStore.set(documentId, documentInfo);

  return {
    id: documentInfo.id,
    fileName: documentInfo.fileName,
    pageCount: documentInfo.pageCount,
    status: documentInfo.status,
    uploadedAt: documentInfo.uploadedAt
  };
};

/**
 * Divide text into manageable chunks preserving paragraph context and page boundaries where possible.
 */
function chunkDocumentText(pages, targetWords = 1000, overlapWords = 150) {
  let chunks = [];
  let currentChunkText = [];
  let currentChunkWordCount = 0;
  let chunkStartPage = 1;
  let chunkEndPage = 1;
  
  let chunkIndex = 0;

  for (const page of pages) {
    if (currentChunkWordCount === 0) {
      chunkStartPage = page.pageNumber;
    }
    
    const words = page.text.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      currentChunkText.push(words[i]);
      currentChunkWordCount++;
      chunkEndPage = page.pageNumber;

      if (currentChunkWordCount >= targetWords) {
        chunks.push({
          chunkId: `chunk-${chunkIndex}`,
          pageStart: chunkStartPage,
          pageEnd: chunkEndPage,
          text: currentChunkText.join(' ')
        });
        chunkIndex++;
        
        // Overlap logic
        const overlapSlice = currentChunkText.slice(-overlapWords);
        currentChunkText = [...overlapSlice];
        currentChunkWordCount = overlapSlice.length;
        chunkStartPage = page.pageNumber; // Rough approximation
      }
    }
  }

  // Push remaining text as final chunk
  if (currentChunkWordCount > 0) {
    chunks.push({
      chunkId: `chunk-${chunkIndex}`,
      pageStart: chunkStartPage,
      pageEnd: chunkEndPage,
      text: currentChunkText.join(' ')
    });
  }

  return chunks;
}

export const getDocument = (id) => {
  return documentStore.get(id);
};

export const deleteDocument = (id) => {
  return documentStore.delete(id);
};
