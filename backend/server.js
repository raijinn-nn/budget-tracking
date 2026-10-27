const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createWorker } = require('tesseract.js');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

let budgetState = {
  startingBudget: 100.0,
  remainingBudget: 100.0,
  transactions: []
};

// Regex price extractor
function extractPriceFromText(text) {
  if (!text) return null;
  const cleanedText = text.replace(/[\r\n]+/g, ' ');
  const priceRegex = /(?:\$)?\s*(\d{1,5}(?:\.\d{2})?)/g;
  let matches = [];
  let match;
  while ((match = priceRegex.exec(cleanedText)) !== null) {
    const val = parseFloat(match[1]);
    if (!isNaN(val) && val > 0) {
      matches.push(val);
    }
  }
  return matches.length > 0 ? Math.max(...matches) : null;
}

app.post('/api/scan-price', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const worker = await createWorker('eng');
    const ret = await worker.recognize(req.file.buffer);
    await worker.terminate();

    const rawText = ret.data.text;
    const extractedPrice = extractPriceFromText(rawText);

    if (extractedPrice === null) {
      return res.status(422).json({ 
        success: false, 
        message: 'Could not detect a valid price from image', 
        rawText 
      });
    }

    if (extractedPrice > budgetState.remainingBudget) {
      return res.status(400).json({
        success: false,
        message: 'Extracted price exceeds remaining budget',
        extractedPrice,
        remainingBudget: budgetState.remainingBudget
      });
    }

    budgetState.remainingBudget = parseFloat((budgetState.remainingBudget - extractedPrice).toFixed(2));
    const transaction = {
      id: Date.now().toString(),
      amount: extractedPrice,
      timestamp: new Date().toISOString()
    };
    budgetState.transactions.unshift(transaction);

    res.json({
      success: true,
      extractedPrice,
      remainingBudget: budgetState.remainingBudget,
      transaction
    });
  } catch (error) {
    console.error('OCR Error:', error);
    res.status(500).json({ error: 'Internal server error during OCR processing' });
  }
});

app.get('/api/budget', (req, res) => {
  res.json(budgetState);
});

app.post('/api/budget/set', (req, res) => {
  const { startingBudget } = req.body;
  if (typeof startingBudget !== 'number' || startingBudget <= 0) {
    return res.status(400).json({ error: 'Invalid starting budget' });
  }
  budgetState.startingBudget = startingBudget;
  budgetState.remainingBudget = startingBudget;
  budgetState.transactions = [];
  res.json(budgetState);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));

