/**
 * Auto Charting & Statistical Engine
 * Analyzes dataset schema and raw rows to generate pre-aggregated chart payloads.
 */

// Helper to safely parse numbers
const parseNum = (val) => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const str = String(val).replace(/['"$%,]/g, '').trim();
  const num = Number(str);
  return isNaN(num) ? null : num;
};

// Helper to parse dates
const parseDateObj = (val) => {
  if (!val) return null;
  const cleanStr = String(val).replace(/^'/, '').trim();
  const timestamp = Date.parse(cleanStr);
  if (isNaN(timestamp)) return null;
  return new Date(timestamp);
};

// Format date into human readable standard buckets
const formatDateBucket = (date, bucketType) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  if (bucketType === 'month') {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[date.getMonth()]} ${y}`;
  }
  if (bucketType === 'year') {
    return `${y}`;
  }
  return `${y}-${m}-${d}`;
};

/**
 * Generate KPI Summary Metrics for all numeric columns
 */
export const calculateKpis = (numberColumns, rows) => {
  const kpis = [];

  for (const col of numberColumns) {
    let sum = 0;
    let min = Infinity;
    let max = -Infinity;
    let validCount = 0;

    for (const row of rows) {
      const val = parseNum(row[col.name]);
      if (val !== null) {
        sum += val;
        if (val < min) min = val;
        if (val > max) max = val;
        validCount++;
      }
    }

    if (validCount > 0) {
      const avg = sum / validCount;
      kpis.push({
        id: `kpi_${col.name}`,
        name: col.name,
        total: Number(sum.toFixed(2)),
        average: Number(avg.toFixed(2)),
        min: Number(min.toFixed(2)),
        max: Number(max.toFixed(2)),
        count: validCount,
        formattedTotal: sum > 1000000 ? `${(sum / 1000000).toFixed(2)}M` : sum > 1000 ? `${(sum / 1000).toFixed(1)}k` : sum.toFixed(2),
        formattedAvg: avg > 1000 ? `${(avg / 1000).toFixed(1)}k` : avg.toFixed(2),
      });
    }
  }

  return kpis;
};

/**
 * Generate Time Series Line Charts for (Date, Number) column pairs
 */
export const generateLineCharts = (dateColumns, numberColumns, rows) => {
  const charts = [];

  for (const dateCol of dateColumns) {
    for (const numCol of numberColumns.slice(0, 2)) {
      const validEntries = [];
      for (const row of rows) {
        const d = parseDateObj(row[dateCol.name]);
        const v = parseNum(row[numCol.name]);
        if (d && v !== null) {
          validEntries.push({ date: d, value: v });
        }
      }

      if (validEntries.length < 2) continue;

      // Sort chronologically
      validEntries.sort((a, b) => a.date.getTime() - b.date.getTime());

      const firstDate = validEntries[0].date;
      const lastDate = validEntries[validEntries.length - 1].date;
      const daySpan = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);

      let bucketType = 'day';
      if (daySpan > 365) bucketType = 'month';
      else if (daySpan > 90) bucketType = 'month';

      // Aggregate by bucket
      const bucketMap = new Map();
      for (const entry of validEntries) {
        const bucketKey = formatDateBucket(entry.date, bucketType);
        if (!bucketMap.has(bucketKey)) {
          bucketMap.set(bucketKey, { bucketKey, sum: 0, count: 0, rawDate: entry.date });
        }
        const b = bucketMap.get(bucketKey);
        b.sum += entry.value;
        b.count += 1;
      }

      const chartData = Array.from(bucketMap.values()).map((b) => ({
        x: b.bucketKey,
        y: Number(b.sum.toFixed(2)),
        avg: Number((b.sum / b.count).toFixed(2)),
      }));

      if (chartData.length >= 2) {
        charts.push({
          id: `line_${dateCol.name}_${numCol.name}`,
          type: 'line',
          title: `${numCol.name} over Time`,
          subtitle: `Chronological trend by ${dateCol.name}`,
          xAxisLabel: dateCol.name,
          yAxisLabel: numCol.name,
          data: chartData,
        });
      }
    }
  }

  return charts;
};

/**
 * Generate Category Comparison Bar Charts for (Text, Number) column pairs
 */
export const generateBarCharts = (textColumns, numberColumns, rows) => {
  const charts = [];

  // Filter out text columns that are long sentences or freeform notes (e.g. avg text length > 25)
  const categoryColumns = textColumns.filter((col) => {
    let totalLen = 0;
    let count = 0;
    const uniqueSet = new Set();
    for (const row of rows) {
      const v = row[col.name];
      if (v) {
        const s = String(v).trim();
        totalLen += s.length;
        count++;
        uniqueSet.add(s);
      }
    }
    const avgLen = count > 0 ? totalLen / count : 0;
    // Suitable category: avg length <= 30 and cardinality reasonable
    return avgLen <= 30 && uniqueSet.size >= 2;
  });

  for (const textCol of categoryColumns.slice(0, 2)) {
    for (const numCol of numberColumns.slice(0, 2)) {
      const categoryMap = new Map();

      for (const row of rows) {
        let cat = row[textCol.name];
        if (cat === null || cat === undefined || String(cat).trim() === '') {
          cat = 'Unspecified';
        } else {
          cat = String(cat).replace(/^'/, '').trim();
        }

        const v = parseNum(row[numCol.name]);
        if (v !== null) {
          if (!categoryMap.has(cat)) {
            categoryMap.set(cat, { name: cat, value: 0, count: 0 });
          }
          const item = categoryMap.get(cat);
          item.value += v;
          item.count += 1;
        }
      }

      if (categoryMap.size < 2) continue;

      const sorted = Array.from(categoryMap.values()).sort((a, b) => b.value - a.value);

      let chartData = [];
      if (sorted.length > 10) {
        const top10 = sorted.slice(0, 10);
        const others = sorted.slice(10);
        const otherSum = others.reduce((acc, curr) => acc + curr.value, 0);
        chartData = [
          ...top10.map((i) => ({ name: i.name, value: Number(i.value.toFixed(2)) })),
          { name: 'Other Categories', value: Number(otherSum.toFixed(2)) },
        ];
      } else {
        chartData = sorted.map((i) => ({ name: i.name, value: Number(i.value.toFixed(2)) }));
      }

      charts.push({
        id: `bar_${textCol.name}_${numCol.name}`,
        type: 'bar',
        title: `${numCol.name} by ${textCol.name}`,
        subtitle: `Comparison across top ${textCol.name} categories`,
        xAxisLabel: textCol.name,
        yAxisLabel: numCol.name,
        data: chartData,
      });
    }
  }

  return charts;
};

/**
 * Generate Category Distribution Pie Charts for low-cardinality text columns
 */
export const generatePieCharts = (textColumns, numberColumns, rows) => {
  const charts = [];

  for (const textCol of textColumns) {
    const valueMap = new Map();
    let totalEntries = 0;

    for (const row of rows) {
      let cat = row[textCol.name];
      if (cat !== null && cat !== undefined && String(cat).trim() !== '') {
        cat = String(cat).replace(/^'/, '').trim();
        // Skip long descriptive sentences
        if (cat.length <= 30) {
          valueMap.set(cat, (valueMap.get(cat) || 0) + 1);
          totalEntries++;
        }
      }
    }

    // Pie charts are most effective for 2 to 8 distinct categories
    if (valueMap.size >= 2 && valueMap.size <= 8 && totalEntries >= 3) {
      const chartData = Array.from(valueMap.entries()).map(([name, count]) => ({
        name,
        value: count,
        percentage: Number(((count / totalEntries) * 100).toFixed(1)),
      }));

      charts.push({
        id: `pie_${textCol.name}`,
        type: 'pie',
        title: `${textCol.name} Distribution`,
        subtitle: `Proportional breakdown of ${totalEntries} records`,
        data: chartData,
      });
    }
  }

  return charts;
};

/**
 * Main Auto-Charting Coordinator
 */
export const generateAutoCharts = (dataset) => {
  const { columns = [], data = [], fileName = 'Dataset' } = dataset;

  if (!data || data.length === 0) {
    return {
      canChart: false,
      reason: 'The dataset has no rows to visualize.',
      kpis: [],
      charts: [],
    };
  }

  const dateColumns = columns.filter((c) => c.type === 'date');
  const numberColumns = columns.filter((c) => c.type === 'number');
  const textColumns = columns.filter((c) => c.type === 'text');

  if (numberColumns.length === 0 && textColumns.length === 0) {
    return {
      canChart: false,
      reason: 'No numeric or categorical columns detected in this dataset. Try uploading a dataset containing numbers and dates.',
      kpis: [],
      charts: [],
    };
  }

  // 1. Calculate KPIs
  const kpis = calculateKpis(numberColumns, data);

  // 2. Generate Chart Variants
  const lineCharts = generateLineCharts(dateColumns, numberColumns, data);
  const barCharts = generateBarCharts(textColumns, numberColumns, data);
  const pieCharts = generatePieCharts(textColumns, numberColumns, data);

  const allCharts = [...lineCharts, ...barCharts, ...pieCharts];

  return {
    canChart: allCharts.length > 0 || kpis.length > 0,
    fileName,
    totalRecords: data.length,
    columnsSummary: {
      dateCount: dateColumns.length,
      numberCount: numberColumns.length,
      textCount: textColumns.length,
    },
    kpis,
    charts: allCharts,
    generatedAt: new Date().toISOString(),
  };
};
