# Implementation Plan - Budget Tracking Web App (React + Node.js + Tesseract.js)

[Overview]
The goal is to build a responsive web-based budget tracking application using React (Vite) for the frontend, Node.js & Express for the backend API, and Tesseract.js for extracting prices from product price tag images captured via webcam or uploaded photo. The scope includes setting up a starting budget, capturing price tag photos via browser camera or file upload, performing OCR text extraction to parse price values, automatically deducting prices from the remaining budget, and maintaining a real-time transaction history log.

[Types]
Type system changes / TypeScript interfaces:
- `Transaction`:
  - `id: string`
  - `amount: number`
  - `timestamp: string`
- `BudgetState`:
  - `startingBudget: number`
  - `remainingBudget: number`
  - `transactions: Transaction[]`
- `OCRResult`:
  - `success: boolean`
  - `extractedPrice: number`
  - `remainingBudget: number`
  - `transaction: Transaction`

[Files]
File modifications and new files:
- `frontend/src/App.jsx`: Main React component managing budget setup, dashboard view, and camera modal/capture.
- `backend/server.js`: Node.js Express server handling OCR processing (`tesseract.js`) and budget state management.
- `backend/package.json`: Node dependencies (`express`, `cors`, `tesseract.js`, `multer`).
- `frontend/package.json`: Frontend dependencies (`react`, `react-dom`, `axios`, `tailwindcss`, etc.).

[Functions]
Function modifications and new functions:
- `extractPriceFromText(ocrText: string): number | null`: Regular expression parser to extract currency/price values from OCR text.
- `captureImage()`: Captures frame from HTML5 video stream or image upload file.
- `handleScan(imageBlob)`: Sends image POST request to backend `/api/scan-price`.
- `POST /api/scan-price`: Backend endpoint processing multipart image upload with Tesseract.js.

[Classes]
Class modifications: None (functional React & Node.js architecture).

[Dependencies]
Dependency modifications:
- Frontend (`frontend/package.json`):
  - `react`, `react-dom`, `axios`, `lucide-react`
- Backend (`backend/package.json`):
  - `express`, `cors`, `tesseract.js`, `multer`

[Testing]
Testing approach:
- Unit testing price extraction regex parser with sample OCR strings.
- Integration testing Express OCR endpoint with sample price tag images.
- Manual browser testing across Chrome/Safari/Firefox for webcam access and OCR recognition.

[Implementation Order]
1. Set up Node.js Express backend with Multer file upload and Tesseract.js OCR integration.
2. Implement robust regex price parsing logic in backend/shared utility.
3. Set up React frontend with Vite, Tailwind CSS, and API service client (`axios`).
4. Build Budget Setup and Dashboard components displaying remaining budget and transaction list.
5. Implement Web Camera capture component using HTML5 MediaDevices stream and capture buttons.
6. Connect camera capture to backend OCR endpoint and wire up budget deduction state updates.
