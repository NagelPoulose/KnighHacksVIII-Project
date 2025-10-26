# ServiceNow Accelerator AI Backend

A FastAPI-based backend that optimizes the ServiceNow accelerator analysis process by running parallel AI agents across 5 data sections.

## Features

- **Parallel Processing**: Splits customer request data into 5 sections and processes them simultaneously
- **Google AI Integration**: Uses Google's Gemini API for pattern analysis and recommendations
- **Result Consolidation**: Intelligently merges results from all sections
- **FastAPI Backend**: RESTful API for frontend integration
- **Async Processing**: Non-blocking operations for better performance

## Setup

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure Environment**:
   ```bash
   cp env.example .env
   # Edit .env and add your GOOGLE_API_KEY
   ```

3. **Run the Backend**:
   ```bash
   # Start the FastAPI server
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   
   # Or run the analysis script directly
   python run_analysis.py
   ```

## API Endpoints

### POST `/analyze-parallel`
Analyze customer requests in parallel across 5 sections.

**Request Body**:
```json
{
  "requests": [
    {
      "number": "A2E00001",
      "capability": "Reporting and Visualization Export",
      "company": "BrightVision Consulting",
      "description": "The customer needs an easy way to export...",
      "initiative_title": "Export Visualizations as High-Resolution Images",
      "primary_category": "Technical How-To"
    }
  ],
  "accelerators": [
    {
      "name": "Extend Your AI Search",
      "description": "Prescriptive guidance on extending your AI Search..."
    }
  ]
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Analysis completed for 576 requests across 5 sections",
  "consolidated_result": {
    "consolidated_analysis": {
      "emergingNeeds": [...],
      "patterns": [...],
      "trends": [...],
      "gaps": [...],
      "recommendations": [...],
      "overallConfidence": 85.5
    },
    "section_results": [...],
    "total_processing_time": 45.2,
    "total_data_points": 576
  }
}
```

### GET `/results`
Get consolidated analysis results.

### GET `/results/{section_id}`
Get results for a specific section (1-5).

### GET `/status`
Get system status and processing information.

## Performance Benefits

- **5x Parallel Processing**: Instead of processing 576 requests sequentially, the system processes ~115 requests per section simultaneously
- **Reduced Latency**: Total processing time is roughly the time of the slowest section, not the sum of all sections
- **Better Resource Utilization**: Multiple AI API calls run concurrently
- **Scalable Architecture**: Easy to adjust the number of sections based on data size

## Data Flow

1. **Data Loading**: Load customer requests and accelerators from CSV files
2. **Data Splitting**: Divide requests into 5 equal sections
3. **Parallel Analysis**: Each section is processed by a separate AI agent
4. **Result Consolidation**: Results are merged and deduplicated
5. **Response**: Consolidated analysis is returned to the frontend

## Error Handling

- Graceful fallback for API failures
- Individual section failures don't affect other sections
- Comprehensive logging for debugging
- Retry mechanisms for transient failures

## Integration with Frontend

The backend is designed to work seamlessly with your existing React frontend. Update your frontend to call the new FastAPI endpoints instead of the direct AI agent calls.

Example frontend integration:
```javascript
const response = await fetch('http://localhost:8000/analyze-parallel', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ requests, accelerators })
});
const results = await response.json();
```

