import mongoose from 'mongoose';
import { Dataset } from '../models/dataset.model.js';
import { ChatMessage } from '../models/chatMessage.model.js';
import { generateChatAnswer } from '../services/llm.service.js';

const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL || 'http://localhost:8000';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'sbd_internal_secure_key_2026';
const QUERY_TIMEOUT_MS = 6000;

/**
 * Helper to inspect the question and determine if a targeted Python query should be executed
 */
const detectTargetedQuery = (question, dataset) => {
  if (!dataset || !Array.isArray(dataset.columns) || !Array.isArray(dataset.data) || dataset.data.length === 0) {
    return null;
  }

  const q = question.toLowerCase();
  const filters = [];
  let aggregation = null;

  // Check for date pattern in question (YYYY-MM-DD or YYYY-MM)
  const dateMatch = question.match(/\b(\d{4}-\d{2}-\d{2})\b/) || question.match(/\b(\d{4}-\d{2})\b/);
  const dateCol = dataset.columns.find((c) => c.type === 'date');
  if (dateMatch && dateCol) {
    filters.push({
      column: dateCol.name,
      operator: 'contains',
      value: dateMatch[1],
    });
  }

  // Check for category matches in text columns
  const textCols = dataset.columns.filter((c) => c.type === 'text');
  for (const col of textCols) {
    if (Array.isArray(col.sampleValues)) {
      for (const sample of col.sampleValues) {
        if (sample && sample.length > 2 && q.includes(sample.toLowerCase())) {
          filters.push({
            column: col.name,
            operator: 'case_insensitive_equals',
            value: sample,
          });
          break;
        }
      }
    }
  }

  // Check for aggregation intent
  const numericCols = dataset.columns.filter((c) => c.type === 'number');
  if (numericCols.length > 0) {
    // Find matching numeric column in question
    let targetNumCol = numericCols.find((c) => q.includes(c.name.toLowerCase()));
    if (!targetNumCol && (q.includes('revenue') || q.includes('sale'))) {
      targetNumCol = numericCols.find((c) => /sale|revenue|amount/i.test(c.name)) || numericCols[0];
    }

    if (targetNumCol) {
      if (/total|sum|overall|how\s*much/i.test(q)) {
        aggregation = { column: targetNumCol.name, operation: 'sum' };
      } else if (/average|mean/i.test(q)) {
        aggregation = { column: targetNumCol.name, operation: 'mean' };
      } else if (/max|highest|peak/i.test(q)) {
        aggregation = { column: targetNumCol.name, operation: 'max' };
      } else if (/min|lowest/i.test(q)) {
        aggregation = { column: targetNumCol.name, operation: 'min' };
      } else if (/how\s*many|count/i.test(q)) {
        aggregation = { column: targetNumCol.name, operation: 'count' };
      }
    }
  }

  // If we found specific filters, return the query spec
  if (filters.length > 0) {
    return {
      filters,
      aggregation: aggregation || undefined,
      limit: 5,
    };
  }

  return null;
};

/**
 * Execute targeted lookup query against Python microservice
 */
const executePythonQuery = async (querySpec, datasetData) => {
  try {
    const payload = {
      data: datasetData.slice(0, 1000), // Safety cap for fast lookup
      filters: querySpec.filters,
      aggregation: querySpec.aggregation,
      limit: querySpec.limit || 5,
    };

    console.log(`[Chat Controller] Dispatching targeted query to Python microservice:`, JSON.stringify(querySpec));
    const response = await fetch(`${ANALYSIS_SERVICE_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': INTERNAL_API_KEY,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(QUERY_TIMEOUT_MS),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`[Chat Controller] Targeted query successful, matched records: ${result.count}`);
      return result;
    }
    console.warn(`[Chat Controller] Targeted query returned status: ${response.status}`);
    return null;
  } catch (err) {
    console.warn(`[Chat Controller] Targeted query error:`, err.message);
    return null;
  }
};

/**
 * POST /api/datasets/:id/chat
 * User sends a question and receives an anti-hallucinated grounded response
 */
export const sendChatMessage = async (req, res, next) => {
  const { id } = req.params;
  const { question, conversationHistory = [] } = req.body;
  const userIdentifiers = [req.user?.uid, req.user?.email].filter(Boolean);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid ID', message: 'Invalid dataset identifier format.' });
  }

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return res.status(400).json({ error: 'Bad Request', message: 'Question cannot be empty.' });
  }

  const trimmedQuestion = question.trim().slice(0, 500);

  try {
    const dataset = await Dataset.findById(id);
    if (!dataset) {
      return res.status(404).json({ error: 'Not Found', message: 'Dataset not found.' });
    }

    if (!userIdentifiers.includes(dataset.userId)) {
      return res.status(403).json({ error: 'Forbidden', message: 'You do not have permission to chat with this dataset.' });
    }

    // 1. Detect if question needs targeted lookup query from Python engine
    let targetedQueryResult = null;
    const querySpec = detectTargetedQuery(trimmedQuestion, dataset);
    if (querySpec) {
      targetedQueryResult = await executePythonQuery(querySpec, dataset.data);
    }

    // 2. Generate grounded answer
    const chatResult = await generateChatAnswer({
      question: trimmedQuestion,
      conversationHistory,
      analysisData: dataset.analysisCache || { rowCount: dataset.rowCount, statistics: [], summary: { columns: dataset.columns.map((c) => c.name) } },
      forecastData: dataset.forecastCache,
      targetedQueryResult,
      datasetName: dataset.fileName,
    });

    // 3. Persist messages to DB
    const primaryUserId = req.user?.uid || req.user?.email;
    const userMsg = new ChatMessage({
      datasetId: dataset._id,
      userId: primaryUserId,
      role: 'user',
      content: trimmedQuestion,
    });

    const assistantMsg = new ChatMessage({
      datasetId: dataset._id,
      userId: primaryUserId,
      role: 'assistant',
      content: chatResult.answer,
      queryContext: chatResult.queryContext || null,
    });

    await ChatMessage.insertMany([userMsg, assistantMsg]);

    return res.status(200).json({
      success: true,
      answer: chatResult.answer,
      provider: chatResult.provider,
      mode: chatResult.mode,
      queryContext: chatResult.queryContext,
      timestamp: assistantMsg.createdAt,
    });
  } catch (error) {
    console.error(`[Chat Controller] Error processing chat message:`, error);
    next(error);
  }
};

/**
 * GET /api/datasets/:id/chat/history
 * Fetch past chat messages for this dataset & user
 */
export const getChatHistory = async (req, res, next) => {
  const { id } = req.params;
  const userIdentifiers = [req.user?.uid, req.user?.email].filter(Boolean);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid ID', message: 'Invalid dataset identifier format.' });
  }

  try {
    const dataset = await Dataset.findById(id);
    if (!dataset) {
      return res.status(404).json({ error: 'Not Found', message: 'Dataset not found.' });
    }

    if (!userIdentifiers.includes(dataset.userId)) {
      return res.status(403).json({ error: 'Forbidden', message: 'You do not have permission to access chat history for this dataset.' });
    }

    const messages = await ChatMessage.find({
      datasetId: dataset._id,
      userId: { $in: userIdentifiers },
    })
      .sort({ createdAt: 1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error(`[Chat Controller] Error fetching chat history:`, error);
    next(error);
  }
};

/**
 * DELETE /api/datasets/:id/chat/history
 * Clear chat history for this dataset & user
 */
export const clearChatHistory = async (req, res, next) => {
  const { id } = req.params;
  const userIdentifiers = [req.user?.uid, req.user?.email].filter(Boolean);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid ID', message: 'Invalid dataset identifier format.' });
  }

  try {
    const dataset = await Dataset.findById(id);
    if (!dataset) {
      return res.status(404).json({ error: 'Not Found', message: 'Dataset not found.' });
    }

    if (!userIdentifiers.includes(dataset.userId)) {
      return res.status(403).json({ error: 'Forbidden', message: 'You do not have permission to modify chat history for this dataset.' });
    }

    const result = await ChatMessage.deleteMany({
      datasetId: dataset._id,
      userId: { $in: userIdentifiers },
    });

    return res.status(200).json({
      success: true,
      message: 'Chat history cleared successfully.',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error(`[Chat Controller] Error clearing chat history:`, error);
    next(error);
  }
};
