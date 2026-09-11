"""
Smart Business Dashboard - Python Analysis Microservice (Phase 4)
FastAPI application providing deep statistical data analysis.
Protected with internal API key authentication.
"""

import os
import time
import logging
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
import uvicorn
import pandas as pd

from analyzer import run_full_analysis
from forecaster import compute_forecast

# Load environment configuration
load_dotenv()

PORT = int(os.getenv("PORT", "8000"))
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "sbd_internal_secure_key_2026")
MAX_ROWS = int(os.getenv("MAX_ANALYSIS_ROWS", "50000"))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("analysis-service")

app = FastAPI(
    title="Smart Business Dashboard - Analysis Microservice",
    description="Internal Python service for statistical data analysis, trends, outliers, and correlations.",
    version="1.0.0",
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Timing & Diagnostic Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    path = request.url.path
    method = request.method
    logger.info(f"Incoming request: {method} {path}")

    try:
        response = await call_next(request)
        process_time_ms = round((time.time() - start_time) * 1000, 2)
        response.headers["X-Process-Time"] = f"{process_time_ms}ms"
        logger.info(f"Completed: {method} {path} status={response.status_code} duration={process_time_ms}ms")
        return response
    except Exception as exc:
        process_time_ms = round((time.time() - start_time) * 1000, 2)
        logger.error(f"Error processing {method} {path}: {str(exc)} after {process_time_ms}ms", exc_info=True)
        raise exc

# Pydantic Request Models
class ColumnInfo(BaseModel):
    name: str
    type: Optional[str] = "text"

class AnalysisRequest(BaseModel):
    dataset_id: Optional[str] = Field(default=None, description="Unique identifier of dataset")
    columns: List[ColumnInfo] = Field(default_factory=list, description="Dataset column metadata")
    data: List[Dict[str, Any]] = Field(default_factory=list, description="Dataset rows")

    @field_validator("data")
    @classmethod
    def validate_row_limit(cls, v):
        if len(v) > MAX_ROWS:
            raise ValueError(f"Dataset exceeds the maximum limit of {MAX_ROWS:,} rows for analysis (received {len(v):,}).")
        return v

class ForecastRequest(BaseModel):
    dataset_id: Optional[str] = Field(default=None, description="Unique identifier of dataset")
    columns: List[ColumnInfo] = Field(default_factory=list, description="Dataset column metadata")
    data: List[Dict[str, Any]] = Field(default_factory=list, description="Dataset rows")
    target_numeric_column: Optional[str] = Field(default=None, description="Specific numeric column to forecast")
    target_date_column: Optional[str] = Field(default=None, description="Specific date column for timeline")
    periods_to_project: Optional[int] = Field(default=5, ge=3, le=6, description="Number of future periods to project")

    @field_validator("data")
    @classmethod
    def validate_row_limit(cls, v):
        if len(v) > MAX_ROWS:
            raise ValueError(f"Dataset exceeds the maximum limit of {MAX_ROWS:,} rows for forecasting (received {len(v):,}).")
        return v

# Security Dependency
def verify_internal_key(x_internal_key: Optional[str] = Header(None, alias="X-Internal-Key")):
    """Verifies that the caller has provided the correct internal shared secret."""
    if not x_internal_key or x_internal_key != INTERNAL_API_KEY:
        logger.warning("Unauthorized access attempt: invalid or missing X-Internal-Key")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Valid X-Internal-Key header is required.",
        )
    return True

@app.get("/health", tags=["Monitoring"])
async def health_check():
    """Service health check endpoint."""
    return {
        "status": "ok",
        "service": "analysis-service",
        "version": "1.0.0",
        "maxRows": MAX_ROWS,
    }

@app.post("/analyze", tags=["Analysis"])
async def analyze_dataset(payload: AnalysisRequest, request: Request):
    """
    Primary statistical analysis endpoint.
    Protected by X-Internal-Key header.
    """
    # Verify internal authorization header
    raw_key = request.headers.get("X-Internal-Key")
    verify_internal_key(raw_key)

    try:
        raw_columns = [col.model_dump() for col in payload.columns]
        result = run_full_analysis(
            dataset_id=payload.dataset_id,
            columns=raw_columns,
            data=payload.data,
        )
        return result
    except Exception as e:
        logger.error(f"Analysis computation failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Statistical analysis calculation failed: {str(e)}",
        )

@app.post("/forecast", tags=["Forecasting"])
async def forecast_dataset(payload: ForecastRequest, request: Request):
    """
    Time-series forecasting endpoint (Phase 6).
    Protected by X-Internal-Key header.
    """
    raw_key = request.headers.get("X-Internal-Key")
    verify_internal_key(raw_key)

    try:
        raw_columns = [col.model_dump() for col in payload.columns]
        df = pd.DataFrame(payload.data)
        result = compute_forecast(
            df=df,
            columns=raw_columns,
            target_date_col=payload.target_date_column,
            target_num_col=payload.target_numeric_column,
            periods_to_project=payload.periods_to_project or 5,
        )
        result["datasetId"] = payload.dataset_id
        return result
    except Exception as e:
        logger.error(f"Forecast computation failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forecast calculation failed: {str(e)}",
        )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=False)
