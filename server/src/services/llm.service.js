/**
 * Smart Business Dashboard - AI Explanation Layer (Phase 5)
 * Universal LLM Service supporting:
 * - OpenAI (gpt-4o-mini / gpt-4o)
 * - Anthropic Claude (claude-3-5-sonnet / claude-3-haiku)
 * - Google Gemini (gemini-1.5-flash / gemini-2.0-flash)
 * - Intelligent local business synthesizer fallback
 */

const TIMEOUT_MS = 20000;
const MAX_TOKENS = 1200;

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
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
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
  const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
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
