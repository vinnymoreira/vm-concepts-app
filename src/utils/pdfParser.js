import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker - use the bundled worker
// This approach works better with Vite/modern bundlers
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href;

/**
 * Extract transactions from a PDF credit card statement
 * @param {File} file - PDF file to parse
 * @returns {Promise<Array>} Array of parsed transactions
 */
export const extractTransactionsFromPDF = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

    console.log(`PDF loaded: ${pdf.numPages} pages`);
    let fullText = '';

    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // Better text extraction that preserves line structure
      // Group items by Y position to maintain lines
      const lines = {};
      textContent.items.forEach(item => {
        const y = Math.round(item.transform[5]); // Y coordinate
        if (!lines[y]) {
          lines[y] = [];
        }
        lines[y].push(item.str);
      });

      // Join items in each line, then join lines
      const pageText = Object.keys(lines)
        .sort((a, b) => b - a) // Sort by Y coordinate (top to bottom)
        .map(y => lines[y].join(' '))
        .join('\n');

      console.log(`Page ${i} extracted ${Object.keys(lines).length} lines`);
      fullText += pageText + '\n';
    }

    console.log('Full extracted text (first 500 chars):', fullText.substring(0, 500));

    // Parse transactions
    const transactions = parseTransactions(fullText);
    console.log(`Parsed ${transactions.length} transactions`);

    return transactions;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF. Please make sure the file is a valid PDF.');
  }
};

/**
 * Auto-detect category based on merchant name
 * @param {string} merchant - Merchant name
 * @returns {string} Category name or empty string
 */
const detectCategory = (merchant) => {
  const merchantUpper = merchant.toUpperCase();

  // Category detection patterns (order matters - more specific first)
  const patterns = [
    // Web Hosting
    { keywords: ['WPENGINE', 'DNHGODADDY', 'GODADDY'], category: 'Web Hosting' },

    // Software (check before general Amazon)
    { keywords: ['CLAUDE.AI', 'ANTHROPIC', 'SPOTIFY', 'NETFLIX', 'GOOGLE', 'YOUTUBE'], category: 'Software' },

    // Entertainment (Amazon Prime should be separate from Amazon)
    { keywords: ['AMAZON PRIME'], category: 'Entertainment' },

    // Office Supplies
    { keywords: ['AMAZON', 'WALMART', 'APPLE.COM', 'HOME DEPOT', 'BESTBUY', 'IKEA'], category: 'Office Supplies' },

    // Meals
    { keywords: ['GRILL', 'BURGER', 'TST BOSSA NOVA', 'BAKERY', 'CAFE', 'IN-N-OUT', 'RESTAURANT', 'RESTAURANTE', 'PARFOGO', 'SUSHI'], category: 'Meals' },

    // Travel/Lodge
    { keywords: ['EXPEDIA', 'HILTON', 'AMERICAN AIR', 'UNITED', 'DELTA', 'COPA', 'HOTEL', 'HOSTEL', 'AIRBNB'], category: 'Travel / Lodge' },

    // Groceries
    { keywords: ['TARGET', 'SMART AND FINAL', 'SPROUTS', 'CVS', 'VONS', 'TRADER JOE', 'TROPICAL', 'SMART&FINAL'], category: 'Groceries' },

    // Transportation
    { keywords: ['UBER', 'LYFT'], category: 'Transportation' },

    // Utilities
    { keywords: ['ATTBILL', 'T-MOBILE', 'TMOBILE', 'AT&T'], category: 'Utilities' },

    // Other
    { keywords: ['ROSS', 'MARSHALLS', 'NORDSTROM'], category: 'Other' },
  ];

  // Check each pattern
  for (const pattern of patterns) {
    for (const keyword of pattern.keywords) {
      if (merchantUpper.includes(keyword)) {
        console.log(`Auto-detected category: ${merchant} → ${pattern.category}`);
        return pattern.category;
      }
    }
  }

  return ''; // No match, user will categorize manually
};

/**
 * Detect if a transaction is revenue based on merchant/description
 * @param {string} merchant - Merchant or description text
 * @returns {boolean} True if likely a revenue transaction
 */
const isRevenueTransaction = (merchant) => {
  const merchantUpper = merchant.toUpperCase();

  // Revenue indicators
  const revenueKeywords = [
    'PAYMENT', 'CREDIT', 'REFUND', 'RETURN', 'CASH BACK',
    'CASHBACK', 'REWARD', 'DEPOSIT', 'REIMBURSEMENT',
    'REVERSAL', 'ADJUSTMENT', 'STATEMENT CREDIT',
    'ZELLE FROM', 'VENMO FROM', 'PAYPAL FROM', 'WIRE FROM',
    'ACH CREDIT', 'DIRECT DEPOSIT', 'TRANSFER FROM'
  ];

  return revenueKeywords.some(keyword => merchantUpper.includes(keyword));
};

/**
 * Parse transaction text and extract structured data
 * @param {string} text - Extracted text from PDF
 * @returns {Array} Array of transaction objects
 */
const parseTransactions = (text) => {
  const transactions = [];
  const lines = text.split('\n');

  console.log(`Parsing ${lines.length} lines for transactions...`);

  // Pattern 1: DATE DESCRIPTION AMOUNT BALANCE (bank statement format)
  // Example: "10/27 Zelle From Adrian Hernandez on 10/27 Ref # Baco4Xlol3N9 500.00 9,372.34"
  // Captures the transaction amount (500.00), not the balance (9,372.34)
  const pattern1 = /(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s+(.+?)\s+([\d,]+\.\d{2})\s+[\d,]+\.\d{2}\s*$/;

  // Pattern 2: DATE DESCRIPTION -AMOUNT BALANCE (negative amounts with balance)
  // Example: "10/10 PAYMENT RECEIVED -500.00 9,372.34"
  const pattern2 = /(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s+(.+?)\s+-\s*([\d,]+\.\d{2})\s+[\d,]+\.\d{2}\s*$/;

  // Pattern 3: MM/DD MERCHANT_NAME LOCATION AMOUNT (credit card format, no balance)
  // Example: "10/10 AMAZON MKTPL*NF2LF3661 Amzn.com/bill WA 38.40"
  const pattern3 = /(\d{1,2}\/\d{1,2})\s+(.+?)\s+([\d,]+\.\d{2})\s*$/;

  // Pattern 4: MERCHANT AMOUNT (simpler format)
  // Example: "AMAZON 38.40"
  const pattern4 = /^([A-Z][A-Za-z\s\*\.\-&']+?)\s+([\d,]+\.\d{2})\s*$/;

  // Pattern 5: DATE DESCRIPTION AMOUNT (flexible, no balance)
  // Example: "10/10/2024 Amazon Purchase 38.40"
  const pattern5 = /(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s+(.+?)\s+([\d,]+\.\d{2})\s*$/;

  // Pattern 6: Negative amounts without balance (credits/payments)
  // Example: "10/10 PAYMENT RECEIVED -500.00"
  const pattern6 = /(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s+(.+?)\s+-\s*([\d,]+\.\d{2})\s*$/;

  let sampleLines = 0;
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.length < 5) continue;

    // Log first 10 lines that have potential amounts for debugging
    if (sampleLines < 10 && /\d+\.\d{2}/.test(trimmedLine)) {
      console.log(`Sample line ${sampleLines + 1}:`, trimmedLine);
      sampleLines++;
    }

    let match = null;
    let date = null;
    let merchant = null;
    let amount = null;
    let isCredit = false;

    // Try patterns in order of specificity (most specific first)

    // Try pattern 1 first (bank statement with balance - most specific)
    match = trimmedLine.match(pattern1);
    if (match) {
      date = match[1];
      merchant = match[2];
      amount = match[3];
    } else {
      // Try pattern 2 (negative amounts with balance)
      match = trimmedLine.match(pattern2);
      if (match) {
        date = match[1];
        merchant = match[2];
        amount = match[3];
        isCredit = true;
      } else {
        // Try pattern 6 (negative amounts without balance)
        match = trimmedLine.match(pattern6);
        if (match) {
          date = match[1];
          merchant = match[2];
          amount = match[3];
          isCredit = true;
        } else {
          // Try pattern 3 (credit card format)
          match = trimmedLine.match(pattern3);
          if (match) {
            date = match[1];
            merchant = match[2];
            amount = match[3];
          } else {
            // Try pattern 5 (flexible date format)
            match = trimmedLine.match(pattern5);
            if (match) {
              date = match[1];
              merchant = match[2];
              amount = match[3];
            } else {
              // Try pattern 4 (no date, simplest format)
              match = trimmedLine.match(pattern4);
              if (match) {
                // Use today's date if no date found
                const today = new Date();
                date = `${today.getMonth() + 1}/${today.getDate()}`;
                merchant = match[1];
                amount = match[2];
              }
            }
          }
        }
      }
    }

    if (match && merchant && amount) {
      // Clean up merchant name
      merchant = merchant
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/\*+/g, '')
        .substring(0, 100); // Limit length

      // Skip if merchant is too short or looks like a header
      if (merchant.length < 3) continue;
      if (/^(date|transaction|amount|description|merchant|total|balance|payment|fee)/i.test(merchant)) continue;

      // Detect transaction type - revenue or expense
      const isRevenue = isCredit || isRevenueTransaction(merchant);

      // Auto-detect category based on merchant name (only for expenses)
      const detectedCategory = isRevenue ? '' : detectCategory(merchant);

      transactions.push({
        transaction_date: convertToFullDate(date),
        merchant: merchant,
        amount: parseFloat(amount.replace(/,/g, '')),
        type: isRevenue ? 'revenue' : 'expense',
        category: detectedCategory, // Auto-detected for expenses or empty for manual categorization
        source: 'pdf_upload',
        description: ''
      });

      if (isRevenue) {
        console.log(`Detected revenue: ${merchant} - $${amount}`);
      }
    }
  }

  // Remove duplicates (sometimes PDFs have duplicate entries)
  const uniqueTransactions = transactions.filter((transaction, index, self) =>
    index === self.findIndex((t) => (
      t.transaction_date === transaction.transaction_date &&
      t.merchant === transaction.merchant &&
      t.amount === transaction.amount
    ))
  );

  return uniqueTransactions;
};

/**
 * Convert short date format (MM/DD or MM/DD/YY or MM/DD/YYYY) to YYYY-MM-DD
 * @param {string} shortDate - Date in MM/DD format
 * @returns {string} Date in YYYY-MM-DD format
 */
const convertToFullDate = (shortDate) => {
  const parts = shortDate.split('/');
  const currentYear = new Date().getFullYear();

  let month, day, year;

  if (parts.length === 2) {
    // MM/DD format
    month = parts[0];
    day = parts[1];
    year = currentYear;
  } else if (parts.length === 3) {
    // MM/DD/YY or MM/DD/YYYY format
    month = parts[0];
    day = parts[1];
    year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
  } else {
    // Fallback to today
    const today = new Date();
    month = today.getMonth() + 1;
    day = today.getDate();
    year = currentYear;
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

/**
 * Validate PDF file
 * @param {File} file - File to validate
 * @returns {Object} Validation result with isValid and error message
 */
export const validatePDFFile = (file) => {
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }

  if (file.type !== 'application/pdf') {
    return { isValid: false, error: 'File must be a PDF' };
  }

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 10MB' };
  }

  return { isValid: true, error: null };
};
