from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import asyncio
import json
import os
from datetime import datetime
import google.generativeai as genai
from dotenv import load_dotenv
import logging

# Import ADK agents
try:
    from adk_agent import ADKParallelAgent, ADK_AVAILABLE
    print("✅ Google ADK integration loaded")
except ImportError as e:
    print(f"⚠️ Google ADK integration not available: {e}")
    ADKParallelAgent = None
    ADK_AVAILABLE = False

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="ServiceNow Accelerator AI Backend", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Google AI
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    logger.warning("GOOGLE_API_KEY not found in environment variables")

genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash-exp')

# Pydantic models
class CustomerRequest(BaseModel):
    number: str
    capability: str
    company: str
    description: str
    initiative_title: str
    primary_category: str

class Accelerator(BaseModel):
    name: str
    description: str

class AnalysisRequest(BaseModel):
    requests: List[CustomerRequest]
    accelerators: List[Accelerator]

# Global storage for results
analysis_results = {}

class ParallelAcceleratorAgent:
    def __init__(self, section_id: int):
        self.section_id = section_id
        self.name = f"Accelerator Agent Section {section_id}"
        
    async def analyze_section(self, requests: List[CustomerRequest], accelerators: List[Accelerator]) -> Dict[str, Any]:
        """Analyze a section of customer requests using Google AI"""
        start_time = datetime.now()
        
        try:
            logger.info(f"Starting analysis for section {self.section_id} with {len(requests)} requests")
            
            # Prepare data summary
            customer_data = {
                "summary": {
                    "totalRequests": len(requests),
                    "topCategories": self._get_top_categories(requests),
                    "commonTags": self._get_common_tags(requests),
                },
                "customerRequests": [
                    {
                        "number": req.number,
                        "title": req.initiative_title,
                        "description": req.description,
                        "capability": req.capability,
                        "category": req.primary_category,
                        "company": req.company
                    } for req in requests
                ]
            }
            
            # Create enhanced prompt for parallel processing
            prompt = f"""
            As a ServiceNow Pattern Analysis Agent (Section {self.section_id}), analyze the following customer data to identify emerging needs and patterns:
            
            SECTION {self.section_id} DATA:
            - Total Requests: {customer_data['summary']['totalRequests']}
            - Top Categories: {', '.join(customer_data['summary']['topCategories'])}
            - Common Tags: {', '.join([t['tag'] for t in customer_data['summary']['commonTags']])}
            
            Sample Requests: {json.dumps(customer_data['customerRequests'][:10], indent=2)}
            
            EXISTING ACCELERATORS: {json.dumps([{"name": a.name, "description": a.description} for a in accelerators[:5]], indent=2)}
            
            Please provide a comprehensive analysis with confidence scores (0-100):
            1. Top 5 emerging customer needs with confidence scores
            2. Pattern analysis of common pain points with frequency metrics
            3. Trend analysis with directional indicators
            4. Gap analysis in current offerings with severity ratings
            5. Top 10 NEW ServiceNow accelerator recommendations (NOT in the existing list) with urgency levels
            
            IMPORTANT: For each recommendation, include the request numbers (e.g., REQ001, REQ002) that inspired it in the "evidenceRequests" array.
            
            Format your response as a JSON object with these exact keys:
            {{
                "emergingNeeds": [
                    {{"need": "description", "confidence": 85, "frequency": 45, "category": "automation"}}
                ],
                "patterns": [
                    {{"pattern": "description", "confidence": 90, "occurrences": 32, "impact": "high"}}
                ],
                "trends": [
                    {{"trend": "description", "direction": "increasing", "strength": 80, "timeframe": "3-6 months"}}
                ],
                "gaps": [
                    {{"gap": "description", "severity": "high", "affectedCustomers": 25, "confidence": 85}}
                ],
                "recommendations": [
                    {{"recommendation": "New ServiceNow Accelerator Name", "description": "What it does", "priority": "high", "confidence": 88, "expectedImpact": "high", "evidenceRequests": ["REQ001", "REQ002", "REQ003"]}}
                ],
                "overallConfidence": 85,
                "dataQuality": "high",
                "sampleSize": {len(requests)}
            }}
            """
            
            # Call Google AI
            response = await self._call_google_ai(prompt)
            parsed_response = self._parse_response(response)
            
            # Calculate processing time
            processing_time = (datetime.now() - start_time).total_seconds()
            
            # Create result
            result = {
                "section_id": self.section_id,
                "emerging_needs": parsed_response.get("emergingNeeds", []),
                "patterns": parsed_response.get("patterns", []),
                "trends": parsed_response.get("trends", []),
                "gaps": parsed_response.get("gaps", []),
                "recommendations": parsed_response.get("recommendations", []),
                "overall_confidence": parsed_response.get("overallConfidence", 0),
                "processing_time": processing_time,
                "data_points_analyzed": len(requests),
                "timestamp": datetime.now().isoformat()
            }
            
            logger.info(f"Completed analysis for section {self.section_id} in {processing_time:.2f}s")
            return result
            
        except Exception as e:
            logger.error(f"Error in section {self.section_id} analysis: {str(e)}")
            # Return fallback result
            return {
                "section_id": self.section_id,
                "emerging_needs": [],
                "patterns": [],
                "trends": [],
                "gaps": [],
                "recommendations": [],
                "overall_confidence": 0,
                "processing_time": (datetime.now() - start_time).total_seconds(),
                "data_points_analyzed": len(requests),
                "timestamp": datetime.now().isoformat()
            }
    
    async def _call_google_ai(self, prompt: str) -> str:
        """Call Google AI API"""
        try:
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Google AI API error: {str(e)}")
            raise
    
    def _parse_response(self, response: str) -> Dict[str, Any]:
        """Parse AI response with robust JSON extraction"""
        try:
            # Clean the response
            cleaned_response = response.strip()
            
            # Method 1: Try to find complete JSON object
            import re
            
            # Look for JSON object boundaries
            start_idx = cleaned_response.find('{')
            if start_idx != -1:
                # Find the matching closing brace
                brace_count = 0
                end_idx = start_idx
                for i, char in enumerate(cleaned_response[start_idx:], start_idx):
                    if char == '{':
                        brace_count += 1
                    elif char == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            end_idx = i + 1
                            break
                
                if end_idx > start_idx:
                    json_str = cleaned_response[start_idx:end_idx]
                    
                    # Clean up common JSON issues
                    json_str = re.sub(r',\s*}', '}', json_str)  # Remove trailing commas
                    json_str = re.sub(r',\s*]', ']', json_str)  # Remove trailing commas in arrays
                    
                    try:
                        parsed = json.loads(json_str)
                        if isinstance(parsed, dict):
                            logger.info(f"Successfully parsed JSON response")
                            return parsed
                    except json.JSONDecodeError as je:
                        logger.warning(f"JSON decode error: {je}")
            
            # Method 2: Try regex patterns for JSON extraction
            json_patterns = [
                r'```json\s*(\{.*?\})\s*```',  # JSON in code blocks
                r'```\s*(\{.*?\})\s*```',  # JSON in generic code blocks
                r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}',  # Simple nested objects
            ]
            
            for pattern in json_patterns:
                matches = re.findall(pattern, cleaned_response, re.DOTALL)
                for match in matches:
                    try:
                        json_str = match.strip()
                        if json_str.startswith('{') and json_str.endswith('}'):
                            parsed = json.loads(json_str)
                            if isinstance(parsed, dict):
                                logger.info(f"Successfully parsed JSON with pattern: {pattern}")
                                return parsed
                    except json.JSONDecodeError:
                        continue
            
            # Method 3: Extract information using regex if JSON parsing fails
            logger.warning("JSON parsing failed, extracting information with regex")
            return self._extract_info_with_regex(cleaned_response)
            
        except Exception as e:
            logger.error(f"Error parsing response: {str(e)}")
            return self._create_fallback_response()

    def _extract_info_with_regex(self, text: str) -> dict:
        """Extract information using regex patterns when JSON parsing fails"""
        try:
            import re
            
            # Extract recommendations
            recommendations = []
            rec_pattern = r'(?:recommendation|suggestion|advice)[:\s]*([^.\n]+)'
            rec_matches = re.findall(rec_pattern, text, re.IGNORECASE)
            for i, match in enumerate(rec_matches[:5]):
                recommendations.append({
                    "recommendation": match.strip(),
                    "priority": "high" if i < 2 else "medium",
                    "confidence": 75 - (i * 5)
                })
            
            # Extract patterns
            patterns = []
            pattern_matches = re.findall(r'(?:pattern|trend|common)[:\s]*([^.\n]+)', text, re.IGNORECASE)
            for i, match in enumerate(pattern_matches[:3]):
                patterns.append({
                    "pattern": match.strip(),
                    "confidence": 70 - (i * 5)
                })
            
            # Extract needs
            needs = []
            need_matches = re.findall(r'(?:need|requirement|demand)[:\s]*([^.\n]+)', text, re.IGNORECASE)
            for i, match in enumerate(need_matches[:3]):
                needs.append({
                    "need": match.strip(),
                    "confidence": 65 - (i * 5)
                })
            
            return {
                "emergingNeeds": needs if needs else [{"need": "ServiceNow automation and reporting", "confidence": 60}],
                "patterns": patterns if patterns else [{"pattern": "Customer requests for technical assistance", "confidence": 60}],
                "trends": [{"trend": "Growing demand for self-service", "direction": "increasing", "strength": 60}],
                "gaps": [{"gap": "Knowledge base and automation", "severity": "medium", "confidence": 60}],
                "recommendations": recommendations if recommendations else [{"recommendation": "Enhance customer self-service capabilities", "priority": "high", "confidence": 60}],
                "overallConfidence": 65
            }
            
        except Exception as e:
            logger.error(f"Error in regex extraction: {e}")
            return self._create_fallback_response()

    def _create_fallback_response(self) -> dict:
        """Create a fallback response when all parsing methods fail"""
        return {
            "emergingNeeds": [{"need": "ServiceNow automation and reporting", "confidence": 60}],
            "patterns": [{"pattern": "Customer requests for technical assistance", "confidence": 60}],
            "trends": [{"trend": "Growing demand for self-service", "direction": "increasing", "strength": 60}],
            "gaps": [{"gap": "Knowledge base and automation", "severity": "medium", "confidence": 60}],
            "recommendations": [{"recommendation": "Enhance customer self-service capabilities", "priority": "high", "confidence": 60}],
            "overallConfidence": 60
        }
    
    def _get_top_categories(self, requests: List[CustomerRequest]) -> List[str]:
        """Get top categories from requests"""
        categories = [req.primary_category for req in requests if req.primary_category]
        category_counts = {}
        for cat in categories:
            category_counts[cat] = category_counts.get(cat, 0) + 1
        return sorted(category_counts.keys(), key=lambda x: category_counts[x], reverse=True)[:5]
    
    def _get_common_tags(self, requests: List[CustomerRequest]) -> List[Dict[str, Any]]:
        """Get common tags from requests"""
        capabilities = [req.capability for req in requests if req.capability]
        capability_counts = {}
        for cap in capabilities:
            capability_counts[cap] = capability_counts.get(cap, 0) + 1
        return [{"tag": cap, "count": count} for cap, count in sorted(capability_counts.items(), key=lambda x: x[1], reverse=True)[:5]]

# API Endpoints

@app.get("/")
async def root():
    return {"message": "ServiceNow Accelerator AI Backend", "status": "running"}

@app.post("/analyze-parallel")
async def analyze_parallel(request: AnalysisRequest):
    """Analyze customer requests in parallel across 5 sections"""
    try:
        logger.info(f"Starting parallel analysis with {len(request.requests)} requests and {len(request.accelerators)} accelerators")
        
        # Split requests into 5 sections
        section_size = len(request.requests) // 5
        sections = []
        for i in range(5):
            start_idx = i * section_size
            end_idx = start_idx + section_size if i < 4 else len(request.requests)
            sections.append(request.requests[start_idx:end_idx])
        
        # Use Google ADK agents if available, otherwise fall back to standard Gemini
        if ADK_AVAILABLE and ADKParallelAgent:
            logger.info("🚀 Using Google ADK agents for parallel analysis (CSV-based pattern recognition)")
            agents = [ADKParallelAgent(i + 1) for i in range(5)]
            # Run ADK analysis in parallel
            tasks = [
                agent.analyze_section(section) 
                for agent, section in zip(agents, sections)
            ]
        else:
            logger.info("🔄 Using standard Google AI agents for parallel analysis")
            agents = [ParallelAcceleratorAgent(i + 1) for i in range(5)]
            # Run standard analysis in parallel
            tasks = [
                agent.analyze_section(section, request.accelerators) 
                for agent, section in zip(agents, sections)
            ]
        
        # Wait for all tasks to complete
        section_results = await asyncio.gather(*tasks)
        
        # Store individual results
        for result in section_results:
            analysis_results[result["section_id"]] = result
        
        # Consolidate results
        consolidated_analysis = consolidate_results(section_results)
        
        logger.info(f"Parallel analysis complete. Total time: {sum(r['processing_time'] for r in section_results):.2f}s")
        
        return {
            "status": "success",
            "message": f"Analysis completed for {len(request.requests)} requests across 5 sections",
            "consolidated_analysis": consolidated_analysis,
            "section_results": section_results
        }
        
    except Exception as e:
        logger.error(f"Error in parallel analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def consolidate_results(section_results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Consolidate results from all sections"""
    logger.info(f"Consolidating results from {len(section_results)} sections")
    
    # Merge all results
    all_emerging_needs = []
    all_patterns = []
    all_trends = []
    all_gaps = []
    all_recommendations = []
    
    for result in section_results:
        all_emerging_needs.extend(result.get("emerging_needs", []))
        all_patterns.extend(result.get("patterns", []))
        all_trends.extend(result.get("trends", []))
        all_gaps.extend(result.get("gaps", []))
        all_recommendations.extend(result.get("recommendations", []))
    
    # Calculate overall metrics
    total_confidence = sum(result.get("overall_confidence", 0) for result in section_results) / len(section_results)
    total_processing_time = sum(result.get("processing_time", 0) for result in section_results)
    total_data_points = sum(result.get("data_points_analyzed", 0) for result in section_results)
    
    return {
        "emergingNeeds": all_emerging_needs[:10],
        "patterns": all_patterns[:10],
        "trends": all_trends[:10],
        "gaps": all_gaps[:10],
        "recommendations": all_recommendations[:10],
        "overallConfidence": total_confidence,
        "totalProcessingTime": total_processing_time,
        "totalDataPoints": total_data_points,
        "sectionsProcessed": len(section_results),
        "consolidationTimestamp": datetime.now().isoformat()
    }

@app.get("/status")
async def get_status():
    """Get system status"""
    return {
        "status": "running",
        "sections_processed": len(analysis_results),
        "timestamp": datetime.now().isoformat(),
        "adk_available": ADK_AVAILABLE,
        "agent_type": "ADKParallelAgent (Google ADK CLI)" if (ADK_AVAILABLE and ADKParallelAgent) else "ParallelAcceleratorAgent (Standard Gemini)"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)