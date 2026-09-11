"""
Smart Business Dashboard - Lightweight Safe Query Engine (Phase 7)

Provides safe, parameterized, injection-proof querying and aggregations
over tabular datasets without sending full raw tables to the LLM.
"""

import math
import logging
from typing import List, Dict, Any, Optional, Union
import pandas as pd
import numpy as np

logger = logging.getLogger("query_engine")

ALLOWED_OPERATORS = {
    "equals", "eq", "==", "case_insensitive_equals",
    "not_equals", "neq", "!=",
    "contains", "like",
    "starts_with",
    "ends_with",
    "greater_than", "gt", ">",
    "less_than", "lt", "<",
    "greater_equal", "gte", ">=",
    "less_equal", "lte", "<=",
    "in",
}

ALLOWED_AGGREGATIONS = {"sum", "mean", "avg", "count", "min", "max", "first"}


def clean_val(val: Any) -> Any:
    """Sanitizes numpy/pandas types into JSON-serializable python primitives."""
    if val is None or pd.isna(val) or (isinstance(val, float) and (math.isnan(val) or np.isinf(val))):
        return None
    if isinstance(val, (np.integer, int)):
        return int(val)
    if isinstance(val, (np.floating, float)):
        return round(float(val), 2)
    if isinstance(val, (pd.Timestamp, np.datetime64)):
        return pd.Timestamp(val).isoformat()
    return str(val)


def execute_safe_query(
    df: pd.DataFrame,
    columns: List[Dict[str, Any]],
    query_filter: Optional[Union[Dict[str, Any], List[Dict[str, Any]]]] = None,
    aggregation: Optional[Dict[str, Any]] = None,
    limit: int = 10,
) -> Dict[str, Any]:
    """
    Executes a structured query against a dataframe safely without using eval/exec.
    """
    if df.empty:
        return {
            "success": True,
            "matchCount": 0,
            "aggregatedValue": None,
            "samples": [],
            "summary": "Dataset contains no rows.",
        }

    # Verify column existence
    existing_columns = set(df.columns)
    col_type_map = {c["name"]: c.get("type", "text") for c in columns if "name" in c}

    filtered_df = df.copy()

    # Normalize filter list
    filter_list = []
    if isinstance(query_filter, list):
        filter_list = [f for f in query_filter if isinstance(f, dict)]
    elif isinstance(query_filter, dict):
        filter_list = [query_filter]

    # 1. Apply Filters sequentially if present
    for flt in filter_list:
        col_name = flt.get("column")
        raw_op = str(flt.get("operator", "equals")).lower().strip()
        val = flt.get("value")

        if col_name and col_name in existing_columns:
            if raw_op not in ALLOWED_OPERATORS:
                logger.warning(f"Rejected unsupported query operator: {raw_op}")
                return {
                    "success": False,
                    "error": f"Unsupported operator '{raw_op}'. Allowed: {sorted(list(ALLOWED_OPERATORS))}",
                }

            col_series = filtered_df[col_name]
            col_type = col_type_map.get(col_name, "text")

            # Handle Date Column Comparisons
            if col_type == "date" or "date" in col_name.lower():
                parsed_col = pd.to_datetime(col_series, errors="coerce")
                parsed_val = pd.to_datetime(val, errors="coerce") if val is not None else None

                if parsed_val is not None and not pd.isna(parsed_val):
                    if raw_op in {"equals", "eq", "==", "case_insensitive_equals"}:
                        mask = parsed_col.dt.date == parsed_val.date()
                    elif raw_op in {"greater_than", "gt", ">"}:
                        mask = parsed_col > parsed_val
                    elif raw_op in {"less_than", "lt", "<"}:
                        mask = parsed_col < parsed_val
                    elif raw_op in {"greater_equal", "gte", ">="}:
                        mask = parsed_col >= parsed_val
                    elif raw_op in {"less_equal", "lte", "<="}:
                        mask = parsed_col <= parsed_val
                    else:
                        mask = parsed_col.dt.strftime("%Y-%m-%d").str.contains(str(val), case=False, na=False)
                else:
                    mask = col_series.astype(str).str.contains(str(val), case=False, na=False)

            # Handle Numeric Column Comparisons
            elif col_type == "number" or pd.api.types.is_numeric_dtype(col_series):
                num_col = pd.to_numeric(col_series, errors="coerce")
                try:
                    num_val = float(val) if val is not None else None
                except (ValueError, TypeError):
                    num_val = None

                if num_val is not None:
                    if raw_op in {"equals", "eq", "==", "case_insensitive_equals"}:
                        mask = np.isclose(num_col, num_val, atol=0.01)
                    elif raw_op in {"not_equals", "neq", "!="}:
                        mask = ~np.isclose(num_col, num_val, atol=0.01)
                    elif raw_op in {"greater_than", "gt", ">"}:
                        mask = num_col > num_val
                    elif raw_op in {"less_than", "lt", "<"}:
                        mask = num_col < num_val
                    elif raw_op in {"greater_equal", "gte", ">="}:
                        mask = num_col >= num_val
                    elif raw_op in {"less_equal", "lte", "<="}:
                        mask = num_col <= num_val
                    else:
                        mask = num_col == num_val
                else:
                    mask = pd.Series(True, index=filtered_df.index)

            # Handle String / Categorical Comparisons
            else:
                str_col = col_series.astype(str).str.strip()
                str_val = str(val).strip() if val is not None else ""

                if raw_op in {"equals", "eq", "==", "case_insensitive_equals"}:
                    mask = str_col.str.lower() == str_val.lower()
                elif raw_op in {"not_equals", "neq", "!="}:
                    mask = str_col.str.lower() != str_val.lower()
                elif raw_op in {"contains", "like"}:
                    mask = str_col.str.contains(str_val, case=False, na=False)
                elif raw_op == "starts_with":
                    mask = str_col.str.lower().str.startswith(str_val.lower(), na=False)
                elif raw_op == "ends_with":
                    mask = str_col.str.lower().str.endswith(str_val.lower(), na=False)
                elif raw_op == "in" and isinstance(val, (list, set, tuple)):
                    val_set = {str(v).lower().strip() for v in val}
                    mask = str_col.str.lower().isin(val_set)
                else:
                    mask = str_col.str.contains(str_val, case=False, na=False)

            filtered_df = filtered_df[mask]

    match_count = len(filtered_df)

    # 2. Apply Aggregation if requested
    agg_value = None
    agg_col = None
    agg_fn = None

    if aggregation and isinstance(aggregation, dict) and match_count > 0:
        agg_col = aggregation.get("target_column")
        raw_agg_fn = str(aggregation.get("function", "sum")).lower().strip()

        if agg_col and agg_col in existing_columns:
            if raw_agg_fn in ALLOWED_AGGREGATIONS:
                agg_fn = "mean" if raw_agg_fn == "avg" else raw_agg_fn
                num_series = pd.to_numeric(filtered_df[agg_col], errors="coerce").dropna()

                if not num_series.empty:
                    if agg_fn == "sum":
                        agg_value = clean_val(num_series.sum())
                    elif agg_fn == "mean":
                        agg_value = clean_val(num_series.mean())
                    elif agg_fn == "min":
                        agg_value = clean_val(num_series.min())
                    elif agg_fn == "max":
                        agg_value = clean_val(num_series.max())
                    elif agg_fn == "count":
                        agg_value = int(num_series.count())
                    elif agg_fn == "first":
                        agg_value = clean_val(num_series.iloc[0])

    # 3. Extract sample rows up to limit
    limit = max(1, min(25, int(limit)))
    sample_rows = []
    for _, row in filtered_df.head(limit).iterrows():
        sample_rows.append({col: clean_val(row[col]) for col in filtered_df.columns})

    # 4. Generate structured plain summary of the query result
    if agg_value is not None and agg_col and agg_fn:
        summary_text = (
            f"Found {match_count:,} matching record(s). "
            f"{agg_fn.upper()} of '{agg_col}' is {agg_value:,.2f}."
            if isinstance(agg_value, (int, float))
            else f"Found {match_count:,} matching record(s). {agg_fn.upper()} of '{agg_col}' is {agg_value}."
        )
    elif match_count > 0:
        summary_text = f"Found {match_count:,} matching record(s) matching the criteria."
    else:
        summary_text = "No records matched the specified filter criteria in this dataset."

    return {
        "success": True,
        "matchCount": match_count,
        "aggregatedValue": agg_value,
        "aggregationFunction": agg_fn,
        "targetColumn": agg_col,
        "samples": sample_rows,
        "summary": summary_text,
    }
