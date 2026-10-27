import React, { useState, useEffect } from 'react';
import { createWorker } from 'tesseract.js';

export default function App() {
  const [budget, setBudget] = useState(() => {
    const saved = localStorage.getItem('budget_state');
    if (saved) return JSON.parse(saved);
    return { startingBudget: 100.0, remainingBudget: 100.0, transactions: [] };
  });

  const [inputBudget, setInputBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');

  useEffect(() => {
    localStorage.setItem('budget_state', JSON.stringify(budget));
  }, [budget]);

  const handleSetBudget = (e) => {
    e.preventDefault();
    const val = parseFloat(inputBudget);
    if (isNaN(val) || val <= 0) return;
    setBudget({
      startingBudget: val,
      remainingBudget: val,
      transactions: []
    });
    setInputBudget('');
  };

  const extractPriceFromText = (text) => {
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
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setStatusText('Initializing OCR engine...');

    try {
      const worker = await createWorker('eng');
      setStatusText('Scanning price tag image...');
      const ret = await worker.recognize(file);
      await worker.terminate();

      const extractedPrice = extractPriceFromText(ret.data.text);

      if (extractedPrice === null) {
        alert('Could not detect a valid price from the image. Please try again.');
        setLoading(false);
        return;
      }

      if (extractedPrice > budget.remainingBudget) {
        alert(`Extracted price ($${extractedPrice}) exceeds remaining budget!`);
        setLoading(false);
        return;
      }

      const newRemaining = parseFloat((budget.remainingBudget - extractedPrice).toFixed(2));
      const newTransaction = {
        id: Date.now().toString(),
        amount: extractedPrice,
        timestamp: new Date().toISOString()
      };

      setBudget(prev => ({
        ...prev,
        remainingBudget: newRemaining,
        transactions: [newTransaction, ...prev.transactions]
      }));

      alert(`Successfully deducted $${extractedPrice}!`);
    } catch (err) {
      console.error(err);
      alert('OCR processing failed.');
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-gray-50 min-h-screen font-sans">
      <h1 className="text-2xl font-bold text-center mb-6 text-blue-600">Budget Tracker OCR</h1>

      <div className="bg-white p-6 rounded-xl shadow-md mb-6 text-center">
        <p className="text-gray-500 text-sm">Remaining Budget</p>
        <p className={`text-4xl font-extrabold my-2 ${budget.remainingBudget < 0 ? 'text-red-500' : 'text-green-600'}`}>
          ${budget.remainingBudget.toFixed(2)}
        </p>
        <p className="text-gray-400 text-xs">Starting: ${budget.startingBudget.toFixed(2)}</p>

        <form onSubmit={handleSetBudget} className="mt-4 flex gap-2">
          <input
            type="number"
            step="0.01"
            placeholder="Reset Budget"
            value={inputBudget}
            onChange={(e) => setInputBudget(e.target.value)}
            className="flex-1 border rounded px-3 py-1 text-sm"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded text-sm font-medium">Set</button>
        </form>
      </div>

      {/* Camera / Scan Section */}
      <div className="mb-6">
        <label className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2 cursor-pointer transition">
          📷 Snap & Scan Price Tag
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            disabled={loading}
            className="hidden"
          />
        </label>
        {loading && <p className="text-center text-sm text-blue-600 mt-2 font-medium animate-pulse">{statusText}</p>}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-md">
        <h2 className="font-bold text-gray-700 mb-3">Recent Transactions</h2>
        {budget.transactions.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No transactions yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
            {budget.transactions.map((tx) => (
              <li key={tx.id} className="py-2 flex justify-between items-center text-sm">
                <span className="text-gray-600">{new Date(tx.timestamp).toLocaleTimeString()}</span>
                <span className="font-bold text-red-500">-${tx.amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


