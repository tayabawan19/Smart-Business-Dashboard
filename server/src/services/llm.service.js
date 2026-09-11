/**
 * Smart Business Dashboard - AI Explanation Layer (Phase 5)
 * Universal LLM Service supporting:
 * - OpenAI (gpt-4o-mini / gpt-4o)
 * - Anthropic Claude (claude-3-5-sonnet / claude-3-haiku)
 * - Google Gemini (gemini-1.5-flash / gemini-2.0-flash)
 * - Intelligent local business synthesizer fallback
 */

const TIMEOUT_MS = 25000;
const MAX_TOKENS = 2500;

/**
 * System prompt setting analyst persona and strict output constraints
 */
const SYSTEM_PROMPT = `You are a friendly, senior business analyst explaining financial and operational data to a non-technical small business owner.

YOUR CORE RULES:
1. Explain findings in simple, conversational business English (2-4 short sentences per major finding).
2. NEVER use technical statistics jargon. Strictly avoid words like "IQR", "Interquartile Range", "z-score", "standard deviation", "Pearson coefficient", "p-value", or "null hypothesis". Translate them into natural meaning (e.g. "this number looks unusually high compared to the rest of the dataset" or "these two numbers consistently rise together").
3. DO NOT invent external causes that cannot be proven from the data. For example, if revenue dropped in March, say "Revenue saw a sharp dip in March, which is worth investigating further with the team," rather than assuming holidays or supply chain issues.
4. Provide a practical, non-obvious takeaway or question for the owner to consider.
5. Return ONLY a valid JSON array of insight objects matching the exact JSON schema provided. Do NOT include markdown code blocks, backticks, or any conversational text before or after the JSON.

SCHEMA:
[
  {
    "id": "string",
    "type": "summary" | "trend" | "performer" | "outlier" | "correlation",
    "title": "Short Catchy Headline (e.g. Strong 24% Revenue Expansion)",
    "explanation": "2-4 concise, non-technical sentences explaining the business impact.",
    "importance": "high" | "medium" | "low",
    "metric": "Name of relevant column or overall",
    "actionableTip": "One practical takeaway or question to ask the team."
  }
]`;

/**
 * Helper to build a compact, structured prompt from Phase 4 analysis JSON
 */
const buildUserPrompt = (analysisData, datasetName = 'Business Dataset') => {
  const { summary, statistics = [], trends = [], performers = [], outliers = [], correlations = [] } = analysisData;

  const promptObj = {
    dataset: datasetName,
    overview: {
      totalRowsAnalyzed: analysisData.rowCount || 0,
      totalColumns: summary?.totalColumns || 0,
      numericMetrics: statistics.map((s) => s.column),
    },
    keyTrends: trends.slice(0, 3).map((t) => ({
      metric: t.numericColumn,
      period: t.period,
      direction: t.trend,
      overallChangePercent: `${t.totalChangePercent}%`,
      latestPeriodChangePercent: `${t.latestPeriodChangePercent}%`,
      latestValue: t.latestValue,
      averageGrowthRate: `${t.averageGrowthRate}%`,
    })),
    topAndBottomPerformers: performers.slice(0, 2).map((p) => ({
      category: p.categoryColumn,
      metric: p.numericColumn,
      topLeaders: p.topPerformers?.slice(0, 3).map((t) => `${t.category} (${t.sharePercent}% share)`),
      bottomLaggards: p.bottomPerformers?.slice(0, 2).map((b) => `${b.category} (${b.sharePercent}% share)`),
    })),
    unusualAnomalies: outliers.slice(0, 3).map((o) => ({
      metric: o.column,
      totalAnomalies: o.outlierCount,
      percentageOfData: `${o.outlierPercentage}%`,
      sampleFlaggedValues: o.topOutliers?.slice(0, 2).map((row) => ({
        rowNumber: row.rowIndex,
        value: row.value,
        threshold: row.threshold,
        delta: row.distanceFromBoundary,
      })),
    })),
    meaningfulRelationships: correlations.slice(0, 3).map((c) => ({
      metrics: `${c.columnA} and ${c.columnB}`,
      relationship: c.strength,
      insight: c.insight,
    })),
    coreStats: statistics.slice(0, 4).map((s) => ({
      metric: s.column,
      total: s.sum,
      average: s.mean,
      typicalMiddleValue: s.median,
      range: `${s.min} to ${s.max}`,
    })),
  };

  return `Here is the structured statistical analysis for "${datasetName}":\n${JSON.stringify(promptObj, null, 2)}\n\nPlease generate between 4 to 6 high-value, plain-English insight cards explaining these findings to the business owner according to your instructions.`;
};

/**
 * Clean & parse LLM response into valid JSON array
 */
const parseLlmResponse = (rawText) => {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty response from LLM');
  }

  // 1. Direct parse attempt
  try {
    const parsed = JSON.parse(rawText.trim());
    if (Array.isArray(parsed)) return parsed;
    if (parsed.insights && Array.isArray(parsed.insights)) return parsed.insights;
    for (const val of Object.values(parsed)) {
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') return val;
    }
  } catch (e) {
    // Proceed to regex extraction
  }

  // 2. Extract JSON enclosed in markdown code fences or brackets
  const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || rawText.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (jsonMatch) {
    const candidate = jsonMatch[1] || jsonMatch[0];
    const parsed = JSON.parse(candidate.trim());
    if (Array.isArray(parsed)) return parsed;
    if (parsed.insights && Array.isArray(parsed.insights)) return parsed.insights;
    for (const val of Object.values(parsed)) {
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') return val;
    }
  }

  throw new Error('Failed to parse valid JSON array from LLM response');
};

/**
 * Intelligent Local Business Synthesizer
 * High-quality fallback if no LLM API key is configured or if API limits are reached.
 */
export const synthesizeLocalInsights = (analysisData, datasetName = 'Business Dataset') => {
  const { trends = [], performers = [], outliers = [], correlations = [], statistics = [] } = analysisData;
  const insights = [];

  // 1. Executive Summary Insight
  const primaryMetric = statistics[0]?.column || 'Activity';
  const totalVolume = statistics[0]?.sum ? Number(statistics[0].sum).toLocaleString() : null;

  insights.push({
    id: 'insight-exec-summary',
    type: 'summary',
    title: `Executive Overview for ${datasetName}`,
    explanation: `Your dataset covers ${analysisData.rowCount?.toLocaleString() || 0} business records across ${statistics.length} core metrics. ${
      totalVolume ? `Overall volume for ${primaryMetric} totaled ${totalVolume}.` : ''
    } Below are the most significant trajectories and operational highlights identified from your numbers.`,
    importance: 'high',
    metric: primaryMetric,
    actionableTip: 'Review the trend trajectories below to align capacity with current business momentum.',
  });

  // 2. Trend Insights
  trends.slice(0, 2).forEach((t, i) => {
    const isUp = t.trend === 'increasing';
    const isDown = t.trend === 'decreasing';
    const directionWord = isUp ? 'growth' : isDown ? 'softening' : 'stability';

    insights.push({
      id: `insight-trend-${i}`,
      type: 'trend',
      title: `${t.numericColumn} Shows ${isUp ? 'Positive' : isDown ? 'Contracting' : 'Steady'} ${t.period.toUpperCase()} Momentum`,
      explanation: `${t.numericColumn} demonstrated an overall ${t.totalChangePercent > 0 ? '+' : ''}${t.totalChangePercent}% ${directionWord} across the recorded ${t.period} intervals. In the most recent period, it registered at ${t.latestValue?.toLocaleString()} (${t.latestPeriodChangePercent > 0 ? '+' : ''}${t.latestPeriodChangePercent}% change).`,
      importance: Math.abs(t.totalChangePercent) > 20 ? 'high' : 'medium',
      metric: t.numericColumn,
      actionableTip: isDown
        ? `Investigate operational changes or customer patterns during recent periods to halt further drops in ${t.numericColumn}.`
        : `Double down on the top performing drivers that created this ${t.totalChangePercent}% lift.`,
    });
  });

  // 3. Top Performer Insights
  performers.slice(0, 2).forEach((p, i) => {
    const top = p.topPerformers?.[0];
    const second = p.topPerformers?.[1];
    if (top) {
      insights.push({
        id: `insight-performer-${i}`,
        type: 'performer',
        title: `${top.category} Leads ${p.categoryColumn} Contribution`,
        explanation: `"${top.category}" is your standout leader, generating ${top.sharePercent}% of total ${p.numericColumn} (${Number(top.totalValue).toLocaleString()}). ${
          second ? `The runner-up is "${second.category}" accounting for ${second.sharePercent}%.` : ''
        }`,
        importance: top.sharePercent > 40 ? 'high' : 'medium',
        metric: p.numericColumn,
        actionableTip: top.sharePercent > 50
          ? `Over 50% of your ${p.numericColumn} relies on "${top.category}". Consider expanding other categories to diversify revenue concentration.`
          : `Reward and allocate additional marketing or inventory support to "${top.category}".`,
      });
    }
  });

  // 4. Outlier Anomaly Insights
  outliers.slice(0, 1).forEach((o, i) => {
    const topAnomalies = o.topOutliers?.[0];
    if (o.outlierCount > 0) {
      insights.push({
        id: `insight-outlier-${i}`,
        type: 'outlier',
        title: `Unusual Spikes Detected in ${o.column}`,
        explanation: `We noticed ${o.outlierCount} data point${o.outlierCount > 1 ? 's' : ''} in ${o.column} that deviated significantly from standard operating range (${o.outlierPercentage}% of all entries). ${
          topAnomalies ? `For instance, row #${topAnomalies.rowIndex} registered ${topAnomalies.value?.toLocaleString()} compared to typical limits of ${topAnomalies.threshold?.toLocaleString()}.` : ''
        }`,
        importance: o.outlierPercentage > 5 ? 'high' : 'medium',
        metric: o.column,
        actionableTip: 'Review these specific transactions to confirm whether they represent high-value bulk sales or data entry errors.',
      });
    }
  });

  // 5. Correlation Insights
  correlations.slice(0, 1).forEach((c, i) => {
    if (Math.abs(c.correlation) >= 0.4) {
      insights.push({
        id: `insight-corr-${i}`,
        type: 'correlation',
        title: `Close Link Between ${c.columnA} and ${c.columnB}`,
        explanation: `${c.insight} The mathematical relationship is rated as ${c.strength} (score: ${c.correlation > 0 ? '+' : ''}${c.correlation}).`,
        importance: 'medium',
        metric: `${c.columnA} & ${c.columnB}`,
        actionableTip: `You can use changes in ${c.columnA} as an early indicator to anticipate ${c.columnB}.`,
      });
    }
  });

  return insights;
};

/**
 * Call OpenAI Chat Completions API
 */
const callOpenAi = async (apiKey, userPrompt) => {
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  console.log(`[LLM Service] Calling OpenAI API (model: ${model})...`);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: MAX_TOKENS,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;
  return parseLlmResponse(content);
};

/**
 * Call Anthropic Claude Messages API
 */
const callAnthropic = async (apiKey, userPrompt) => {
  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
  console.log(`[LLM Service] Calling Anthropic Claude API (model: ${model})...`);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
      max_tokens: MAX_TOKENS,
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic Claude API error (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  const content = json.content?.[0]?.text;
  return parseLlmResponse(content);
};

/**
 * Call Google Gemini REST API
 */
const callGemini = async (apiKey, userPrompt) => {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  console.log(`[LLM Service] Calling Google Gemini API (model: ${model})...`);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: MAX_TOKENS,
        responseMimeType: 'application/json',
      },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Gemini API error (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  const candidate = json.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  // In Gemini 2.5+, thoughts may be in a part with { thought: true }. Extract the non-thought content part:
  const textPart = parts.find((p) => !p.thought && p.text) || parts[parts.length - 1];
  const content = textPart?.text;
  return parseLlmResponse(content);
};

/**
 * Main Public Service Method
 * Generates plain-English business insights with automatic provider routing & fallback
 */
export const generateBusinessInsights = async (analysisData, datasetName = 'Business Dataset') => {
  const userPrompt = buildUserPrompt(analysisData, datasetName);

  const preferredProvider = (process.env.LLM_PROVIDER || 'auto').toLowerCase();
  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();

  let provider = 'fallback';
  let insights = null;

  // Determine active provider based on configuration and available keys
  if (preferredProvider === 'openai' && openAiKey) {
    provider = 'openai';
  } else if (preferredProvider === 'anthropic' && anthropicKey) {
    provider = 'anthropic';
  } else if (preferredProvider === 'gemini' && geminiKey) {
    provider = 'gemini';
  } else if (openAiKey) {
    provider = 'openai';
  } else if (anthropicKey) {
    provider = 'anthropic';
  } else if (geminiKey) {
    provider = 'gemini';
  }

  console.log(`[LLM Service] Active provider selected: "${provider}"`);

  // Attempt live LLM generation if an active provider was identified
  if (provider !== 'fallback') {
    try {
      if (provider === 'openai') {
        insights = await callOpenAi(openAiKey, userPrompt);
      } else if (provider === 'anthropic') {
        insights = await callAnthropic(anthropicKey, userPrompt);
      } else if (provider === 'gemini') {
        insights = await callGemini(geminiKey, userPrompt);
      }

      if (Array.isArray(insights) && insights.length > 0) {
        console.log(`[LLM Service] Successfully generated ${insights.length} insights via ${provider}.`);
        return {
          insights,
          provider,
          mode: 'live-llm',
          generatedAt: new Date().toISOString(),
        };
      }
    } catch (llmError) {
      console.warn(`[LLM Service] Live LLM generation failed (${provider}):`, llmError.message);
      console.log(`[LLM Service] Gracefully falling back to local business synthesizer...`);
    }
  }

  // Graceful Local Business Synthesizer Fallback
  console.log(`[LLM Service] Utilizing local business synthesizer engine.`);
  const fallbackInsights = synthesizeLocalInsights(analysisData, datasetName);

  return {
    insights: fallbackInsights,
    provider: provider !== 'fallback' ? `${provider} (fallback)` : 'local-synthesizer',
    mode: 'rule-synthesizer',
    generatedAt: new Date().toISOString(),
  };
};

/**
 * Intelligent Local Business Synthesizer for Forecast Explanation (Phase 6)
 */
export const synthesizeLocalForecastExplanation = (forecastData) => {
  if (!forecastData || !forecastData.canForecast) {
    return 'Insufficient historical time-series data to generate a forward projection.';
  }

  const {
    numericColumn = 'Key metric',
    historicalCount = 0,
    granularity = 'monthly',
    trend = 'stable',
    growthRatePercent = 0,
    nextProjectedValue,
    periods = [],
  } = forecastData;

  const nextPeriodLabel = periods[0] || 'next period';
  const formattedVal = nextProjectedValue != null ? `$${Number(nextProjectedValue).toLocaleString()}` : 'projected levels';
  const periodTerm = granularity === 'monthly' ? 'months' : granularity === 'weekly' ? 'weeks' : 'days';

  if (trend === 'upward') {
    return `Based on the last ${historicalCount} ${periodTerm}, ${numericColumn} is trending upward and could reach approximately ${formattedVal} by ${nextPeriodLabel} — though this is an estimate, not a guarantee.`;
  } else if (trend === 'downward') {
    return `Based on the last ${historicalCount} ${periodTerm}, ${numericColumn} is trending downward and is projected to settle around ${formattedVal} by ${nextPeriodLabel} — though this is an estimate, not a guarantee.`;
  } else {
    return `Based on the last ${historicalCount} ${periodTerm}, ${numericColumn} has remained steady and is estimated to stay near ${formattedVal} by ${nextPeriodLabel} — though this is an estimate, not a guarantee.`;
  }
};

const FORECAST_SYSTEM_PROMPT = `You are a friendly, senior business analyst explaining a near-future trend projection to a small business owner.
YOUR CORE RULES:
1. Provide exactly ONE clear, conversational plain-English sentence (max 35 words).
2. ALWAYS caveat forecasts as estimates, never state them as certain fact (use words like "projected", "estimated", "could reach approximately", "though this is an estimate, not a guarantee").
3. Strictly avoid technical statistics jargon (no "linear regression", "r-squared", "residuals", "p-value").
4. Return ONLY a JSON object: { "explanation": "your sentence here" }.`;

/**
 * Generate ONE plain-English AI sentence explaining the forecast with strict estimate caveat (Phase 6)
 */
export const generateForecastExplanation = async (forecastData, datasetName = 'Business Dataset') => {
  if (!forecastData || !forecastData.canForecast) {
    return {
      explanation: 'Insufficient historical data to generate a forward projection.',
      provider: 'local-synthesizer',
    };
  }

  const preferredProvider = (process.env.LLM_PROVIDER || 'auto').toLowerCase();
  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();

  let provider = 'fallback';
  if (preferredProvider === 'openai' && openAiKey) provider = 'openai';
  else if (preferredProvider === 'anthropic' && anthropicKey) provider = 'anthropic';
  else if (preferredProvider === 'gemini' && geminiKey) provider = 'gemini';
  else if (openAiKey) provider = 'openai';
  else if (anthropicKey) provider = 'anthropic';
  else if (geminiKey) provider = 'gemini';

  const userPrompt = `Dataset: "${datasetName}".
Metric: ${forecastData.numericColumn} over ${forecastData.granularity} periods.
Historical periods analyzed: ${forecastData.historicalCount}.
Historical direction: ${forecastData.trend} (growth rate: ${forecastData.growthRatePercent}% per period).
Last actual value: ${forecastData.lastActualValue}.
Next projected period (${forecastData.periods[0]}): approximately ${forecastData.nextProjectedValue}.
Confidence range for next period: ${forecastData.confidenceRange?.[0]?.lower} to ${forecastData.confidenceRange?.[0]?.upper}.

Please provide ONE natural plain-English sentence summarizing this trend and near-future projection, honestly caveating it as an estimate.`;

  if (provider !== 'fallback') {
    try {
      console.log(`[LLM Service] Generating forecast explanation via ${provider}...`);
      let rawContent = null;

      if (provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openAiKey}` },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: FORECAST_SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 200,
            response_format: { type: 'json_object' },
          }),
          signal: AbortSignal.timeout(15000),
        });
        if (res.ok) {
          const json = await res.json();
          rawContent = json.choices?.[0]?.message?.content;
        }
      } else if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-2.5-flash'}:generateContent?key=${geminiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: FORECAST_SYSTEM_PROMPT }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 200, responseMimeType: 'application/json' },
          }),
          signal: AbortSignal.timeout(15000),
        });
        if (res.ok) {
          const json = await res.json();
          const parts = json.candidates?.[0]?.content?.parts || [];
          const textPart = parts.find((p) => !p.thought && p.text) || parts[parts.length - 1];
          rawContent = textPart?.text;
        }
      }

      if (rawContent) {
        try {
          const parsed = JSON.parse(rawContent.trim());
          const sentence = parsed.explanation || parsed.sentence || Object.values(parsed)[0];
          if (typeof sentence === 'string' && sentence.length > 10) {
            return { explanation: sentence, provider, mode: 'live-llm' };
          }
        } catch (parseErr) {
          // fallback below
        }
      }
    } catch (err) {
      console.warn(`[LLM Service] Forecast explanation LLM call failed (${provider}):`, err.message);
    }
  }

  // Local fallback synthesizer
  const localSentence = synthesizeLocalForecastExplanation(forecastData);
  return {
    explanation: localSentence,
    provider: provider !== 'fallback' ? `${provider} (fallback)` : 'local-synthesizer',
    mode: 'rule-synthesizer',
  };
};

/**
 * Chat System Prompt for Phase 7 (Chat With Your Data)
 * Strict anti-hallucination, grounding, and persona constraints.
 */
const CHAT_SYSTEM_PROMPT = `You are a friendly, concise business analyst answering questions about a user's uploaded business dataset.

CORE RULES:
1. ONLY answer using the verified dataset context provided below (statistical summary, performers, trends, anomalies, forecast projections, and targeted lookup results).
2. If the answer cannot be determined from the provided dataset context, or if the question refers to columns, dates, or concepts not present in the data, you MUST say:
   "I don't have enough information in this dataset to answer that."
   You may add a short, polite explanation of what data is available or missing.
3. NEVER make up, assume, or hallucinate numbers, names, or causes not grounded in the data.
4. If the question is completely unrelated to this dataset (e.g. asking for code, world trivia, weather, jokes, or opinions), politely decline and prompt the user to ask about their business data.
5. Keep your answers direct and concise (2-4 clear sentences).
6. Always state any forecast or projection as an estimate based on historical trends, never as a guaranteed certainty.
7. Use clean Markdown for readability (bold key numbers, bullet points where comparing items).`;

/**
 * Build compact context string for chat prompt
 */
const buildChatContext = (analysisData, forecastData, targetedQueryResult, datasetName) => {
  const { summary, statistics = [], trends = [], performers = [], outliers = [], correlations = [] } = analysisData || {};

  const ctx = {
    datasetName: datasetName || 'Business Dataset',
    rowCount: analysisData?.rowCount || 0,
    columns: summary?.columns || (statistics.map(s => s.column) || []),
    metricSummaries: statistics.slice(0, 6).map(s => ({
      column: s.column,
      totalSum: s.sum,
      average: s.mean,
      median: s.median,
      min: s.min,
      max: s.max,
    })),
    keyTrends: trends.slice(0, 3).map(t => ({
      metric: t.numericColumn,
      period: t.period,
      direction: t.trend,
      totalChangePercent: `${t.totalChangePercent}%`,
      averageGrowthRate: `${t.averageGrowthRate}%`,
      latestValue: t.latestValue,
    })),
    topAndBottomPerformers: performers.slice(0, 3).map(p => ({
      category: p.categoryColumn,
      metric: p.numericColumn,
      topLeader: p.topPerformers?.[0] ? `${p.topPerformers[0].category} (${p.topPerformers[0].sharePercent}% share, total ${p.topPerformers[0].totalValue})` : null,
      topRunnerUp: p.topPerformers?.[1] ? `${p.topPerformers[1].category} (${p.topPerformers[1].sharePercent}% share)` : null,
      bottomLaggard: p.bottomPerformers?.[0] ? `${p.bottomPerformers[0].category} (${p.bottomPerformers[0].sharePercent}% share)` : null,
    })),
    anomalies: outliers.slice(0, 3).map(o => ({
      metric: o.column,
      count: o.outlierCount,
      percentageOfData: `${o.outlierPercentage}%`,
      sampleFlagged: o.topOutliers?.slice(0, 2).map(r => `Row ${r.rowIndex}: value ${r.value} (threshold ${r.threshold})`),
    })),
    correlations: correlations.slice(0, 2).map(c => ({
      metrics: `${c.columnA} & ${c.columnB}`,
      strength: c.strength,
      insight: c.insight,
    })),
    forecast: forecastData?.canForecast ? {
      metric: forecastData.numericColumn,
      granularity: forecastData.granularity,
      trend: forecastData.trend,
      growthRatePercent: `${forecastData.growthRatePercent}%`,
      lastActualValue: forecastData.lastActualValue,
      nextProjectedValue: forecastData.nextProjectedValue,
      nextPeriod: forecastData.periods?.[0],
      projectedPeriods: forecastData.periods?.slice(0, 3).map((p, i) => `${p}: ~${forecastData.values?.[i]}`),
    } : null,
  };

  if (targetedQueryResult) {
    ctx.targetedQueryResult = targetedQueryResult;
  }

  return JSON.stringify(ctx, null, 2);
};

/**
 * Intelligent Local Synthesizer for Chat (Phase 7 Fallback)
 * Formulates accurate, grounded answers when LLM keys are not configured or offline.
 */
export const synthesizeLocalChatAnswer = (question, analysisData, forecastData, targetedQueryResult, datasetName = 'Business Dataset') => {
  const q = (question || '').toLowerCase().trim();
  const stats = analysisData?.statistics || [];
  const trends = analysisData?.trends || [];
  const performers = analysisData?.performers || [];
  const outliers = analysisData?.outliers || [];
  const columns = analysisData?.summary?.columns || stats.map(s => s.column);

  // 1. If targeted query result is present, answer directly from it
  if (targetedQueryResult && targetedQueryResult.success) {
    const matchCount = targetedQueryResult.matchCount ?? targetedQueryResult.count ?? 0;
    const aggVal = targetedQueryResult.aggregatedValue ?? targetedQueryResult.aggregation?.value;
    const aggOp = (targetedQueryResult.aggregationFunction ?? targetedQueryResult.aggregation?.operation ?? 'calculation').toUpperCase();
    const targetCol = targetedQueryResult.targetColumn ?? targetedQueryResult.aggregation?.column ?? 'metric';
    const samples = targetedQueryResult.samples || targetedQueryResult.records || [];

    if (aggVal !== null && aggVal !== undefined) {
      return `Based on your dataset, the **${aggOp}** for **${targetCol}** is **${Number(aggVal).toLocaleString()}** (calculated across ${matchCount} matching record${matchCount === 1 ? '' : 's'}).`;
    }
    if (samples.length > 0) {
      const sample = samples[0];
      const details = Object.entries(sample).slice(0, 5).map(([k, v]) => `**${k}**: ${v}`).join(', ');
      return `Found **${matchCount}** matching record${matchCount === 1 ? '' : 's'} in ${datasetName}. For example: ${details}.`;
    }
    if (matchCount === 0) {
      return `I checked the dataset for that specific filter, but found no matching records.`;
    }
  }

  // 2. Greetings
  if (/^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening))/i.test(q)) {
    return `Hello! I'm your data assistant for **${datasetName}**. You can ask me about total sales, highest/lowest values, top-performing categories, growth trends, unusual outliers, or future forecasts.`;
  }

  // 3. Question about available columns or summary
  if (/columns|fields|what\s*(is\s*in|does)\s*(this|the)\s*data/i.test(q)) {
    return `This dataset contains **${analysisData?.rowCount || 0}** rows across the following columns: **${columns.join(', ')}**. What specific metric would you like to explore?`;
  }

  // 4. Forecast / Future questions
  if (/forecast|future|next\s*(month|quarter|week|period)|predict|projection/i.test(q)) {
    if (forecastData && forecastData.canForecast) {
      const nextPeriod = forecastData.periods?.[0] || 'the next period';
      const nextVal = forecastData.nextProjectedValue != null ? Number(forecastData.nextProjectedValue).toLocaleString() : 'N/A';
      return `Based on historical trends in **${forecastData.numericColumn}**, the model projects a **${forecastData.trend}** trajectory (approx. ${forecastData.growthRatePercent}% change per period). The estimated value for **${nextPeriod}** is approximately **${nextVal}** — though please note this is a projection, not a guarantee.`;
    } else {
      return `I don't have enough chronological data in this dataset to generate a forecast projection. To enable forecasting, please ensure your dataset includes a date column with multiple distinct time periods.`;
    }
  }

  // 5. Outliers / Anomalies
  if (/outlier|anomaly|anomalies|spike|unusual|odd/i.test(q)) {
    if (outliers.length > 0 && outliers[0].outlierCount > 0) {
      const o = outliers[0];
      const sample = o.topOutliers?.[0];
      return `We detected **${o.outlierCount}** unusual spike${o.outlierCount > 1 ? 's' : ''} in **${o.column}** (${o.outlierPercentage}% of records). ${
        sample ? `For example, row #${sample.rowIndex} showed a value of **${Number(sample.value).toLocaleString()}**, well beyond the typical threshold of ${Number(sample.threshold).toLocaleString()}.` : ''
      }`;
    }
    return `No significant statistical anomalies or unusual spikes were detected in this dataset. All values reside within normal operating distributions.`;
  }

  // 6. Top / Best / Leader performer
  if (/top|best|leader|highest\s*performing|most\s*(popular|sold)/i.test(q)) {
    if (performers.length > 0 && performers[0].topPerformers?.length > 0) {
      const p = performers[0];
      const leader = p.topPerformers[0];
      const runnerUp = p.topPerformers[1];
      return `The top performer in **${p.categoryColumn}** by **${p.numericColumn}** is **${leader.category}**, accounting for **${leader.sharePercent}%** of the total (${Number(leader.totalValue).toLocaleString()}). ${
        runnerUp ? `**${runnerUp.category}** followed with **${runnerUp.sharePercent}%**.` : ''
      }`;
    }
  }

  // 7. Worst / Lowest / Laggard performer
  if (/worst|lowest|laggard|least|bottom/i.test(q)) {
    if (performers.length > 0 && performers[0].bottomPerformers?.length > 0) {
      const p = performers[0];
      const laggard = p.bottomPerformers[0];
      return `The lowest contributing category in **${p.categoryColumn}** for **${p.numericColumn}** is **${laggard.category}**, which represents just **${laggard.sharePercent}%** of the total (${Number(laggard.totalValue).toLocaleString()}).`;
    }
  }

  // 8. Trends / Growth
  if (/trend|growth|growing|direction|rise|decline|drop/i.test(q)) {
    if (trends.length > 0) {
      const t = trends[0];
      return `Over the analyzed periods, **${t.numericColumn}** has exhibited a **${t.trend}** trend, with an overall change of **${t.totalChangePercent}%** and an average growth rate of **${t.averageGrowthRate}%** per period.`;
    }
  }

  // 9. Numeric column questions (total, average, max, min)
  for (const s of stats) {
    const colLower = s.column.toLowerCase();
    if (q.includes(colLower) || (colLower.includes('sale') && q.includes('sale')) || (colLower.includes('revenue') && (q.includes('revenue') || q.includes('made')))) {
      if (/total|sum|overall|how\s*much|revenue/i.test(q)) {
        return `The total **${s.column}** across all ${analysisData.rowCount} records is **${Number(s.sum).toLocaleString()}**, with an average of **${Number(s.mean).toLocaleString()}** per record.`;
      }
      if (/average|mean|typical/i.test(q)) {
        return `The average **${s.column}** is **${Number(s.mean).toLocaleString()}**, with a median (typical midpoint) of **${Number(s.median).toLocaleString()}**.`;
      }
      if (/highest|maximum|max|peak/i.test(q)) {
        return `The highest recorded **${s.column}** in this dataset is **${Number(s.max).toLocaleString()}** (the lowest is ${Number(s.min).toLocaleString()}).`;
      }
      if (/lowest|minimum|min/i.test(q)) {
        return `The lowest recorded **${s.column}** in this dataset is **${Number(s.min).toLocaleString()}** (the highest is ${Number(s.max).toLocaleString()}).`;
      }
      return `For **${s.column}**, the total is **${Number(s.sum).toLocaleString()}**, the average is **${Number(s.mean).toLocaleString()}**, and values range between **${Number(s.min).toLocaleString()}** and **${Number(s.max).toLocaleString()}**.`;
    }
  }

  // 10. General Total Revenue / Sales if no specific column matched but general term used
  if (/total|revenue|sales|profit|how\s*much/i.test(q) && stats.length > 0) {
    const primary = stats[0];
    return `The total **${primary.column}** is **${Number(primary.sum).toLocaleString()}**, with an average of **${Number(primary.mean).toLocaleString()}** across **${analysisData.rowCount || 0}** rows.`;
  }

  // 11. Strict anti-hallucination refusal for questions that cannot be answered from dataset
  return `I don't have enough information in this dataset to answer that. The dataset contains **${columns.join(', ')}**, but doesn't include data to support that specific question.`;
};

/**
 * Generate a grounded conversational response to a user question (Phase 7)
 */
export const generateChatAnswer = async ({
  question,
  conversationHistory = [],
  analysisData,
  forecastData,
  targetedQueryResult = null,
  datasetName = 'Business Dataset',
}) => {
  const preferredProvider = (process.env.LLM_PROVIDER || 'auto').toLowerCase();
  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();

  let provider = 'fallback';
  if (preferredProvider === 'openai' && openAiKey) provider = 'openai';
  else if (preferredProvider === 'anthropic' && anthropicKey) provider = 'anthropic';
  else if (preferredProvider === 'gemini' && geminiKey) provider = 'gemini';
  else if (openAiKey) provider = 'openai';
  else if (anthropicKey) provider = 'anthropic';
  else if (geminiKey) provider = 'gemini';

  const contextStr = buildChatContext(analysisData, forecastData, targetedQueryResult, datasetName);
  const boundedHistory = (conversationHistory || []).slice(-6);

  if (provider !== 'fallback') {
    try {
      console.log(`[LLM Service] Generating chat answer via ${provider}...`);

      if (provider === 'openai') {
        const messages = [
          { role: 'system', content: `${CHAT_SYSTEM_PROMPT}\n\n${contextStr}` },
          ...boundedHistory.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: question },
        ];

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openAiKey}` },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages,
            temperature: 0.2,
            max_tokens: 450,
          }),
          signal: AbortSignal.timeout(18000),
        });

        if (res.ok) {
          const json = await res.json();
          const answer = json.choices?.[0]?.message?.content?.trim();
          if (answer) {
            return { answer, provider, mode: 'live-llm', queryContext: targetedQueryResult };
          }
        }
      } else if (provider === 'anthropic') {
        const messages = [
          ...boundedHistory.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: question },
        ];

        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
            system: `${CHAT_SYSTEM_PROMPT}\n\n${contextStr}`,
            messages,
            max_tokens: 450,
            temperature: 0.2,
          }),
          signal: AbortSignal.timeout(18000),
        });

        if (res.ok) {
          const json = await res.json();
          const answer = json.content?.[0]?.text?.trim();
          if (answer) {
            return { answer, provider, mode: 'live-llm', queryContext: targetedQueryResult };
          }
        }
      } else if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-2.5-flash'}:generateContent?key=${geminiKey}`;
        const contents = [
          ...boundedHistory.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
          { role: 'user', parts: [{ text: `CONTEXT:\n${contextStr}\n\nQUESTION: ${question}` }] },
        ];

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: CHAT_SYSTEM_PROMPT }] },
            contents,
            generationConfig: { temperature: 0.2, maxOutputTokens: 450 },
          }),
          signal: AbortSignal.timeout(18000),
        });

        if (res.ok) {
          const json = await res.json();
          const parts = json.candidates?.[0]?.content?.parts || [];
          const textPart = parts.find(p => !p.thought && p.text) || parts[parts.length - 1];
          const answer = textPart?.text?.trim();
          if (answer) {
            return { answer, provider, mode: 'live-llm', queryContext: targetedQueryResult };
          }
        }
      }
    } catch (err) {
      console.warn(`[LLM Service] Chat LLM call failed (${provider}):`, err.message);
    }
  }

  // Intelligent local synthesizer fallback
  const fallbackAnswer = synthesizeLocalChatAnswer(question, analysisData, forecastData, targetedQueryResult, datasetName);
  return {
    answer: fallbackAnswer,
    provider: provider !== 'fallback' ? `${provider} (fallback)` : 'local-synthesizer',
    mode: 'rule-synthesizer',
    queryContext: targetedQueryResult,
  };
};

