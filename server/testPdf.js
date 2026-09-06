import fs from 'fs';
import { processPdfDocument } from './services/documentService.js';

async function run() {
  const buf = fs.readFileSync('./node_modules/pdf-parse/test/data/05-versions-space.pdf');
  try {
     const res = await processPdfDocument(buf, 'test.pdf');
     console.log('Success:', res);
  } catch (e) {
     console.error('Error:', e);
  }
}
run();
