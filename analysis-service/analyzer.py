"""
Smart Business Dashboard - Statistical Analysis Engine (Phase 4)
Performs pandas-based data analysis:
- Period-over-period trend analysis
- Top and bottom performer rankings
- Interquartile range (IQR) outlier detection
- Comprehensive summary statistics
- Pearson correlation matrix and relationship interpretation
"""

import math
import logging
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np

logger = logging.getLogger("analyzer")

def clean_float(val: Any) -> Optional[float]:
    """Helper to convert numpy/pandas floats to JSON-safe python floats."""
    if val is None or pd.isna(val) or np.isinf(val):
        return None
    try:
        f = float(val)
        return round(f, 4) if not math.isnan(f) else None
    except (ValueError, TypeError):
        return None

def compute_summary_statistics(df: pd.DataFrame, numeric_cols: List[str]) -> List[Dict[str, Any]]:
    """Calculates distribution and descriptive statistics for each numeric column."""
    stats = []
    for col in numeric_cols:
        series = pd.to_numeric(df[col], errors="coerce").dropna()
        if series.empty:
            continue

        count_val = int(series.count())
        mean_val = clean_float(series.mean())
        median_val = clean_float(series.median())
        std_val = clean_float(series.std()) if count_val > 1 else 0.0
        min_val = clean_float(series.min())
        max_val = clean_float(series.max())
        sum_val = clean_float(series.sum())
        q25 = clean_float(series.quantile(0.25))
        q75 = clean_float(series.quantile(0.75))

        stats.append({
            "column": col,
            "count": count_val,
            "mean": mean_val,
            "median": median_val,
            "stdDev": std_val,
            "min": min_val,
            "max": max_val,
            "sum": sum_val,
            "q25": q25,
            "q75": q75,
        })
    return stats

def compute_trend_analysis(df: pd.DataFrame, date_cols: List[str], numeric_cols: List[str]) -> List[Dict[str, Any]]:
    """Calculates period-over-period percentage changes and trend directions."""
    trends = []

    # Limit to primary date column and top numeric columns to avoid explosion
    target_date_cols = date_cols[:2]
    target_num_cols = numeric_cols[:4]

    for date_col in target_date_cols:
        # Parse dates safely
        parsed_dates = pd.to_datetime(df[date_col], errors="coerce")
        valid_mask = parsed_dates.notna()
        if valid_mask.sum() < 3:
            continue

        temp_df = df[valid_mask].copy()
        temp_df["_parsed_date"] = parsed_dates[valid_mask]
        temp_df = temp_df.sort_values("_parsed_date")

        min_date = temp_df["_parsed_date"].min()
        max_date = temp_df["_parsed_date"].max()
        days_span = (max_date - min_date).days

        # Decide period aggregation
        if days_span > 180:
            period_freq = "M"
            period_label = "monthly"
            date_format = "%Y-%m"
        elif days_span > 30:
            period_freq = "W"
            period_label = "weekly"
            date_format = "%Y-W%U"
        else:
            period_freq = "D"
            period_label = "daily"
            date_format = "%Y-%m-%d"

        temp_df["_period"] = temp_df["_parsed_date"].dt.strftime(date_format)

        for num_col in target_num_cols:
            temp_df["_num"] = pd.to_numeric(temp_df[num_col], errors="coerce")
            valid_num_df = temp_df[temp_df["_num"].notna()]
            if valid_num_df.empty:
                continue

            grouped = valid_num_df.groupby("_period", sort=False)["_num"].sum().reset_index()
            if len(grouped) < 2:
                continue

            grouped["pct_change"] = grouped["_num"].pct_change() * 100.0

            periods_data = []
            for _, row in grouped.iterrows():
                periods_data.append({
                    "period": str(row["_period"]),
                    "value": clean_float(row["_num"]),
                    "changePercent": clean_float(row["pct_change"]),
                })

            first_val = float(grouped["_num"].iloc[0])
            last_val = float(grouped["_num"].iloc[-1])
            prev_val = float(grouped["_num"].iloc[-2]) if len(grouped) >= 2 else first_val

            total_change_pct = ((last_val - first_val) / abs(first_val) * 100.0) if first_val != 0 else 0.0
            latest_period_pct = ((last_val - prev_val) / abs(prev_val) * 100.0) if prev_val != 0 else 0.0

            valid_changes = grouped["pct_change"].dropna()
            avg_growth = float(valid_changes.mean()) if not valid_changes.empty else 0.0
            volatility = float(valid_changes.std()) if len(valid_changes) > 1 else 0.0

            # Direction heuristic
            if total_change_pct > 3.0:
                direction = "increasing"
            elif total_change_pct < -3.0:
                direction = "decreasing"
            else:
                direction = "stable"

            trends.append({
                "dateColumn": date_col,
                "numericColumn": num_col,
                "period": period_label,
                "trend": direction,
                "totalChangePercent": round(total_change_pct, 2),
                "latestPeriodChangePercent": round(latest_period_pct, 2),
                "averageGrowthRate": round(avg_growth, 2),
                "volatility": round(volatility, 2),
                "latestValue": clean_float(last_val),
                "previousValue": clean_float(prev_val),
                "periods": periods_data[:24],  # Keep reasonable size for UI & Phase 5
            })

    return trends

def compute_performers(df: pd.DataFrame, cat_cols: List[str], numeric_cols: List[str]) -> List[Dict[str, Any]]:
    """Calculates top 5 and bottom 5 performers for categorical-numeric relationships."""
    performers = []
    target_cats = cat_cols[:3]
    target_nums = numeric_cols[:3]

    for cat_col in target_cats:
        for num_col in target_nums:
            temp_df = pd.DataFrame({
                "cat": df[cat_col].astype(str).str.strip(),
                "num": pd.to_numeric(df[num_col], errors="coerce"),
            }).dropna()

            # Ignore placeholder or empty strings
            temp_df = temp_df[~temp_df["cat"].isin(["", "null", "undefined", "NaN", "nan"])]
            if temp_df.empty:
                continue

            grouped = (
                temp_df.groupby("cat")
                .agg(totalValue=("num", "sum"), meanValue=("num", "mean"), count=("num", "count"))
                .reset_index()
            )

            total_cats = len(grouped)
            if total_cats < 2:
                continue

            total_sum = float(grouped["totalValue"].sum())
            grouped = grouped.sort_values(by="totalValue", ascending=False)

            def format_performer_list(subset_df):
                items = []
                for _, r in subset_df.iterrows():
                    val = float(r["totalValue"])
                    share = (val / total_sum * 100.0) if total_sum > 0 else 0.0
                    items.append({
                        "category": str(r["cat"]),
                        "totalValue": clean_float(val),
                        "meanValue": clean_float(r["meanValue"]),
                        "count": int(r["count"]),
                        "sharePercent": round(share, 2),
                    })
                return items

            top_5 = format_performer_list(grouped.head(5))
            bottom_5 = format_performer_list(grouped.tail(5).iloc[::-1]) if total_cats > 5 else []

            performers.append({
                "categoryColumn": cat_col,
                "numericColumn": num_col,
                "totalCategories": total_cats,
                "totalMetricValue": clean_float(total_sum),
                "topPerformers": top_5,
                "bottomPerformers": bottom_5,
            })

    return performers

def compute_outliers(df: pd.DataFrame, numeric_cols: List[str]) -> List[Dict[str, Any]]:
    """Flags anomalies and extreme values in numeric columns using IQR rule."""
    outlier_reports = []

    for col in numeric_cols:
        series = pd.to_numeric(df[col], errors="coerce")
        valid = series.dropna()
        if len(valid) < 8:
            continue

        q1 = valid.quantile(0.25)
        q3 = valid.quantile(0.75)
        iqr = q3 - q1

        if iqr == 0:
            continue

        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr

        outlier_mask = (series < lower_bound) | (series > upper_bound)
        outlier_count = int(outlier_mask.sum())

        if outlier_count == 0:
            continue

        # Extract top 10 most extreme outliers
        outlier_rows = []
        outlier_indices = df[outlier_mask].index

        for idx in outlier_indices:
            val = float(series.loc[idx])
            is_high = val > upper_bound
            distance = round(abs(val - (upper_bound if is_high else lower_bound)), 2)
            outlier_rows.append({
                "rowIndex": int(idx) + 1,  # 1-indexed for human readability
                "value": clean_float(val),
                "boundary": "high" if is_high else "low",
                "threshold": clean_float(upper_bound if is_high else lower_bound),
                "distanceFromBoundary": distance,
            })

        # Sort by furthest distance
        outlier_rows.sort(key=lambda x: x["distanceFromBoundary"], reverse=True)

        outlier_reports.append({
            "column": col,
            "outlierCount": outlier_count,
            "outlierPercentage": round((outlier_count / len(valid)) * 100.0, 2),
            "lowerBound": clean_float(lower_bound),
            "upperBound": clean_float(upper_bound),
            "q1": clean_float(q1),
            "q3": clean_float(q3),
            "iqr": clean_float(iqr),
            "topOutliers": outlier_rows[:10],
        })

    return outlier_reports

def compute_correlations(df: pd.DataFrame, numeric_cols: List[str]) -> List[Dict[str, Any]]:
    """Calculates Pearson correlation coefficients and plain-English relationships."""
    if len(numeric_cols) < 2:
        return []

    correlations = []
    # Build clean numeric sub-dataframe
    num_df = df[numeric_cols].apply(pd.to_numeric, errors="coerce")
    corr_matrix = num_df.corr(method="pearson")

    seen_pairs = set()
    for i in range(len(numeric_cols)):
        for j in range(i + 1, len(numeric_cols)):
            col_a = numeric_cols[i]
            col_b = numeric_cols[j]
            pair_key = tuple(sorted([col_a, col_b]))
            if pair_key in seen_pairs:
                continue
            seen_pairs.add(pair_key)

            coeff = corr_matrix.loc[col_a, col_b]
            if pd.isna(coeff):
                continue

            r = round(float(coeff), 3)

            # Classify correlation strength and direction
            abs_r = abs(r)
            if abs_r >= 0.7:
                strength = "strong positive" if r > 0 else "strong negative"
            elif abs_r >= 0.4:
                strength = "moderate positive" if r > 0 else "moderate negative"
            elif abs_r >= 0.2:
                strength = "weak positive" if r > 0 else "weak negative"
            else:
                strength = "negligible"

            # Plain-English human description for Phase 5 LLM prompt
            if abs_r >= 0.4:
                insight = (
                    f"As '{col_a}' increases, '{col_b}' tends to {'rise proportionally' if r > 0 else 'decrease inversely'}."
                )
            else:
                insight = f"There is little to no linear relationship observed between '{col_a}' and '{col_b}'."

            correlations.append({
                "columnA": col_a,
                "columnB": col_b,
                "correlation": r,
                "strength": strength,
                "insight": insight,
            })

    # Sort pairs by absolute correlation strength descending
    correlations.sort(key=lambda x: abs(x["correlation"]), reverse=True)
    return correlations

def run_full_analysis(dataset_id: Optional[str], columns: List[Dict[str, Any]], data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Main orchestrator for dataset analysis.
    Returns clean, structured JSON format ready for Phase 5 AI ingestion.
    """
    if not data:
        return {
            "datasetId": dataset_id,
            "rowCount": 0,
            "status": "empty",
            "summary": "Dataset is empty.",
            "statistics": [],
            "trends": [],
            "performers": [],
            "outliers": [],
            "correlations": [],
        }

    df = pd.DataFrame(data)

    # Classify columns based on metadata and contents
    numeric_cols = [c["name"] for c in columns if c.get("type") == "number"]
    date_cols = [c["name"] for c in columns if c.get("type") == "date"]
    cat_cols = [c["name"] for c in columns if c.get("type") == "text"]

    # Fallback auto-detection if metadata was incomplete
    if not numeric_cols:
        for col in df.columns:
            converted = pd.to_numeric(df[col], errors="coerce")
            if converted.notna().sum() > len(df) * 0.5:
                numeric_cols.append(col)

    if not date_cols:
        for col in df.columns:
            if col not in numeric_cols:
                parsed = pd.to_datetime(df[col], errors="coerce")
                if parsed.notna().sum() > len(df) * 0.5:
                    date_cols.append(col)

    if not cat_cols:
        cat_cols = [c for c in df.columns if c not in numeric_cols and c not in date_cols]

    logger.info(
        f"Analyzing dataset {dataset_id}: rows={len(df)}, num_cols={numeric_cols}, date_cols={date_cols}, cat_cols={cat_cols}"
    )

    stats = compute_summary_statistics(df, numeric_cols)
    trends = compute_trend_analysis(df, date_cols, numeric_cols)
    performers = compute_performers(df, cat_cols, numeric_cols)
    outliers = compute_outliers(df, numeric_cols)
    correlations = compute_correlations(df, numeric_cols)

    return {
        "datasetId": dataset_id,
        "rowCount": len(df),
        "analyzedAt": pd.Timestamp.now(tz="UTC").isoformat(),
        "summary": {
            "totalColumns": len(df.columns),
            "numericColumns": len(numeric_cols),
            "dateColumns": len(date_cols),
            "categoricalColumns": len(cat_cols),
            "totalOutliersDetected": sum(o["outlierCount"] for o in outliers),
            "significantCorrelationsCount": sum(1 for c in correlations if abs(c["correlation"]) >= 0.4),
        },
        "statistics": stats,
        "trends": trends,
        "performers": performers,
        "outliers": outliers,
        "correlations": correlations,
    }
