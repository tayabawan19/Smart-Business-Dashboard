"""
Smart Business Dashboard - Forecasting Engine (Phase 6)

Provides explainable, lightweight time-series forecasting based on linear trend projection.

NOTE FOR FUTURE EXPANSION:
This engine intentionally uses a simple, highly-interpretable linear trend model
(via NumPy/Pandas) rather than complex ML models like ARIMA or Prophet.
This keeps it fast (<20ms), robust, low-resource, and transparent for MVP small-business use.
It can be upgraded to Holt-Winters exponential smoothing or Prophet in later phases
if seasonal decomposition is needed.
"""

import math
import logging
import warnings
from typing import List, Dict, Any, Optional, Tuple
import pandas as pd
import numpy as np

warnings.filterwarnings("ignore")
logger = logging.getLogger("forecaster")

MIN_HISTORICAL_PERIODS = 5


def clean_num(val: Any) -> Optional[float]:
    """Helper to convert numpy/pandas numbers to JSON-safe python floats."""
    if val is None or pd.isna(val) or np.isinf(val):
        return None
    try:
        f = float(val)
        return round(f, 2) if not math.isnan(f) else None
    except (ValueError, TypeError):
        return None


def detect_columns(
    df: pd.DataFrame,
    columns: List[Dict[str, Any]],
    target_date_col: Optional[str] = None,
    target_num_col: Optional[str] = None,
) -> Tuple[Optional[str], Optional[str]]:
    """Detects or confirms the target date and primary numeric column for forecasting."""
    date_col = target_date_col
    num_col = target_num_col

    # 1. Identify Date column
    if not date_col or date_col not in df.columns:
        # Check column metadata first
        meta_date_cols = [c["name"] for c in columns if c.get("type") == "date" and c["name"] in df.columns]
        if meta_date_cols:
            date_col = meta_date_cols[0]
        else:
            # Fallback auto-detection only for non-numeric columns
            for col in df.columns:
                if pd.api.types.is_numeric_dtype(df[col]):
                    continue
                # Skip if metadata marked it as number
                if any(c["name"] == col and c.get("type") == "number" for c in columns):
                    continue
                parsed = pd.to_datetime(df[col], errors="coerce")
                if parsed.notna().sum() >= max(3, len(df) * 0.4):
                    date_col = col
                    break

    # 2. Identify Numeric column
    if not num_col or num_col not in df.columns:
        meta_num_cols = [c["name"] for c in columns if c.get("type") == "number" and c["name"] in df.columns]
        if meta_num_cols:
            # Priority to revenue/sales/amount/total keywords if present
            priority_keywords = ["revenue", "sales", "total", "amount", "profit", "income", "volume"]
            prioritized = [c for c in meta_num_cols if any(k in c.lower() for k in priority_keywords)]
            num_col = prioritized[0] if prioritized else meta_num_cols[0]
        else:
            # Fallback auto-detection
            for col in df.columns:
                if col == date_col:
                    continue
                converted = pd.to_numeric(df[col], errors="coerce")
                if converted.notna().sum() >= max(3, len(df) * 0.4):
                    num_col = col
                    break

    return date_col, num_col


def step_next_period_label(last_date: pd.Timestamp, granularity: str, step_index: int) -> str:
    """Generates future period labels cleanly based on date granularity."""
    if granularity == "monthly":
        future_date = last_date + pd.DateOffset(months=step_index)
        return future_date.strftime("%Y-%m")
    elif granularity == "weekly":
        future_date = last_date + pd.DateOffset(weeks=step_index)
        return future_date.strftime("%Y-W%U")
    else:  # daily
        future_date = last_date + pd.DateOffset(days=step_index)
        return future_date.strftime("%Y-%m-%d")


def compute_forecast(
    df: pd.DataFrame,
    columns: List[Dict[str, Any]],
    target_date_col: Optional[str] = None,
    target_num_col: Optional[str] = None,
    periods_to_project: int = 5,
) -> Dict[str, Any]:
    """
    Executes linear trend forecasting with confidence intervals.
    Returns clean JSON matching the Phase 6 specification.
    """
    # 1. Column detection
    date_col, num_col = detect_columns(df, columns, target_date_col, target_num_col)

    if not date_col:
        return {
            "canForecast": False,
            "message": "Forecasting requires a date column, none found in this dataset.",
            "dateColumn": None,
            "numericColumn": num_col,
            "periods": [],
            "forecastedValues": [],
            "confidenceRange": [],
            "method": "linear_trend",
        }

    if not num_col:
        return {
            "canForecast": False,
            "message": "Forecasting requires a numeric column, none found in this dataset.",
            "dateColumn": date_col,
            "numericColumn": None,
            "periods": [],
            "forecastedValues": [],
            "confidenceRange": [],
            "method": "linear_trend",
        }

    # 2. Parse and filter valid date/numeric entries
    parsed_dates = pd.to_datetime(df[date_col], errors="coerce")
    parsed_nums = pd.to_numeric(df[num_col], errors="coerce")

    valid_mask = parsed_dates.notna() & parsed_nums.notna()
    if valid_mask.sum() < 3:
        return {
            "canForecast": False,
            "message": "Not enough historical data points to forecast. At least 5 historical time periods are required.",
            "dateColumn": date_col,
            "numericColumn": num_col,
            "periods": [],
            "forecastedValues": [],
            "confidenceRange": [],
            "method": "linear_trend",
        }

    temp_df = pd.DataFrame({
        "date": parsed_dates[valid_mask],
        "val": parsed_nums[valid_mask],
    }).sort_values("date")

    # 3. Determine time granularity (monthly, weekly, daily)
    min_date = temp_df["date"].min()
    max_date = temp_df["date"].max()
    days_span = (max_date - min_date).days

    if days_span > 180:
        date_format = "%Y-%m"
        granularity = "monthly"
    elif days_span > 30:
        date_format = "%Y-W%U"
        granularity = "weekly"
    else:
        date_format = "%Y-%m-%d"
        granularity = "daily"

    temp_df["period_str"] = temp_df["date"].dt.strftime(date_format)

    # Group by chronological period
    grouped = temp_df.groupby("period_str", sort=False).agg(
        val_sum=("val", "sum"),
        last_date=("date", "max"),
    ).reset_index()

    n_historical = len(grouped)

    # 4. Strict check: Minimum required periods
    if n_historical < MIN_HISTORICAL_PERIODS:
        return {
            "canForecast": False,
            "message": f"Not enough historical data to forecast. Found {n_historical} {granularity} period(s), but at least {MIN_HISTORICAL_PERIODS} are required.",
            "dateColumn": date_col,
            "numericColumn": num_col,
            "granularity": granularity,
            "historicalCount": n_historical,
            "periods": [],
            "forecastedValues": [],
            "confidenceRange": [],
            "method": "linear_trend",
        }

    # 5. Linear Trend Fitting (Simple, Explainable, Robust)
    # y = slope * x + intercept
    y_vals = grouped["val_sum"].values.astype(float)
    x_vals = np.arange(n_historical, dtype=float)

    # Calculate linear regression slope & intercept using least squares
    slope, intercept = np.polyfit(x_vals, y_vals, 1)

    # Historical fitted values & residuals
    y_fitted = slope * x_vals + intercept
    residuals = y_vals - y_fitted

    # Residual standard deviation (standard error of estimate)
    dof = max(1, n_historical - 2)
    residual_std = float(np.sqrt(np.sum(residuals**2) / dof))

    # Coefficient of determination (R^2)
    ss_total = np.sum((y_vals - np.mean(y_vals))**2)
    ss_res = np.sum(residuals**2)
    r2 = float(1.0 - (ss_res / ss_total)) if ss_total > 1e-9 else 0.0
    r2 = max(0.0, min(1.0, r2))

    # Ensure periods_to_project is clamped between 3 and 6
    periods_to_project = max(3, min(6, int(periods_to_project)))

    # 6. Future Projections & Confidence Range
    last_timestamp = grouped["last_date"].iloc[-1]
    has_non_negative_history = bool(np.all(y_vals >= 0))

    future_periods: List[str] = []
    forecasted_values: List[float] = []
    confidence_ranges: List[Dict[str, Any]] = []

    for step in range(1, periods_to_project + 1):
        future_x = n_historical - 1 + step
        pred_val = float(slope * future_x + intercept)

        # Confidence interval expands slightly as horizon extends further into future
        expansion_factor = math.sqrt(1.0 + (step / float(n_historical)))
        margin = 1.96 * residual_std * expansion_factor

        lower_bound = pred_val - margin
        upper_bound = pred_val + margin

        # If historical metric is non-negative (e.g. sales/revenue), clamp lower bound to 0
        if has_non_negative_history:
            lower_bound = max(0.0, lower_bound)
            pred_val = max(0.0, pred_val)

        period_label = step_next_period_label(last_timestamp, granularity, step)

        future_periods.append(period_label)
        forecasted_values.append(clean_num(pred_val))
        confidence_ranges.append({
            "period": period_label,
            "lower": clean_num(lower_bound),
            "upper": clean_num(upper_bound),
            "margin": clean_num(margin),
        })

    # Historical periods payload for seamless combined charting
    historical_data = []
    for _, row in grouped.iterrows():
        historical_data.append({
            "period": str(row["period_str"]),
            "value": clean_num(row["val_sum"]),
        })

    # Trend classification
    historical_avg = float(np.mean(y_vals)) if len(y_vals) > 0 else 1.0
    normalized_slope_pct = (slope / historical_avg * 100.0) if historical_avg != 0 else 0.0

    if normalized_slope_pct > 2.0:
        growth_trend = "upward"
    elif normalized_slope_pct < -2.0:
        growth_trend = "downward"
    else:
        growth_trend = "stable"

    first_pred = forecasted_values[0] if forecasted_values else 0.0
    last_actual = clean_num(y_vals[-1])

    next_period_pct_change = (
        round(((first_pred - last_actual) / abs(last_actual) * 100.0), 2)
        if last_actual and last_actual != 0 else 0.0
    )

    logger.info(
        f"Forecast computed for {num_col} ({granularity}): {n_historical} historical periods -> {periods_to_project} projected periods. Trend: {growth_trend} (slope={round(slope, 2)}, R2={round(r2, 3)})"
    )

    return {
        "canForecast": True,
        "dateColumn": date_col,
        "numericColumn": num_col,
        "granularity": granularity,
        "historicalCount": n_historical,
        "historical": historical_data,
        "periods": future_periods,
        "forecastedValues": forecasted_values,
        "confidenceRange": confidence_ranges,
        "method": "linear_trend",
        "trend": growth_trend,
        "growthRatePercent": round(normalized_slope_pct, 2),
        "nextPeriodChangePercent": next_period_pct_change,
        "r2Score": round(r2, 3),
        "slope": clean_num(slope),
        "intercept": clean_num(intercept),
        "lastActualValue": last_actual,
        "nextProjectedValue": first_pred,
        "caveat": "Forecasts are based on historical trends and are estimates only, not guarantees.",
    }
