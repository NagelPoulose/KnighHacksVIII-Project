from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import asyncio
import pandas as pd
import json
import os
from datetime import datetime
import google.generativeai as genai
from dotenv import load_dotenv
import logging

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
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Google AI
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable is required")

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
    section_id: int

class AnalysisResult(BaseModel):
    section_id: int
    emerging_needs: List[Dict[str, Any]]
    patterns: List[Dict[str, Any]]
    trends: List[Dict[str, Any]]
    gaps: List[Dict[str, Any]]
    recommendations: List[Dict[str, Any]]
    overall_confidence: float
    processing_time: float
    data_points_analyzed: int
    timestamp: str

class ConsolidatedResult(BaseModel):
    consolidated_analysis: Dict[str, Any]
    section_results: List[AnalysisResult]
    total_processing_time: float
    total_data_points: int
    timestamp: str

# Global storage for results
analysis_results: Dict[int, AnalysisResult] = {}
consolidated_result: Optional[ConsolidatedResult] = None

class ParallelAcceleratorAgent:
    def __init__(self, section_id: int):
        self.section_id = section_id
        self.name = f"Accelerator Agent Section {section_id}"
        
    async def analyze_section(self, requests: List[CustomerRequest], accelerators: List[Accelerator]) -> AnalysisResult:
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
                    "sentimentDistribution": self._get_sentiment_distribution(requests)
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
            - Sentiment Distribution: {json.dumps(customer_data['summary']['sentimentDistribution'])}
            
            Sample Requests: {json.dumps(customer_data['customerRequests'][:20], indent=2)}
            
            EXISTING ACCELERATORS: {json.dumps([{"name": a.name, "description": a.description} for a in accelerators[:10]], indent=2)}
            
            Please provide a comprehensive analysis with confidence scores (0-100):
            1. Top 5 emerging customer needs with confidence scores
            2. Pattern analysis of common pain points with frequency metrics
            3. Trend analysis with directional indicators
            4. Gap analysis in current offerings with severity ratings
            5. Priority recommendations with urgency levels
            
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
                    {{"recommendation": "description", "priority": "high", "confidence": 88, "expectedImpact": "high"}}
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
            result = AnalysisResult(
                section_id=self.section_id,
                emerging_needs=parsed_response.get("emergingNeeds", []),
                patterns=parsed_response.get("patterns", []),
                trends=parsed_response.get("trends", []),
                gaps=parsed_response.get("gaps", []),
                recommendations=parsed_response.get("recommendations", []),
                overall_confidence=parsed_response.get("overallConfidence", 0),
                processing_time=processing_time,
                data_points_analyzed=len(requests),
                timestamp=datetime.now().isoformat()
            )
            
            logger.info(f"Completed analysis for section {self.section_id} in {processing_time:.2f}s")
            return result
            
        except Exception as e:
            logger.error(f"Error in section {self.section_id} analysis: {str(e)}")
            # Return fallback result
            return AnalysisResult(
                section_id=self.section_id,
                emerging_needs=[],
                patterns=[],
                trends=[],
                gaps=[],
                recommendations=[],
                overall_confidence=0,
                processing_time=(datetime.now() - start_time).total_seconds(),
                data_points_analyzed=len(requests),
                timestamp=datetime.now().isoformat()
            )
    
    async def _call_google_ai(self, prompt: str) -> str:
        """Call Google AI API"""
        try:
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Google AI API error: {str(e)}")
            raise
    
    def _parse_response(self, response: str) -> Dict[str, Any]:
        """Parse AI response"""
        try:
            # Try to extract JSON from response
            json_match = response.find('{')
            if json_match != -1:
                json_str = response[json_match:]
                return json.loads(json_str)
            else:
                # Fallback parsing
                return {
                    "emergingNeeds": [],
                    "patterns": [],
                    "trends": [],
                    "gaps": [],
                    "recommendations": [],
                    "overallConfidence": 0,
                    "rawResponse": response
                }
        except Exception as e:
            logger.error(f"Error parsing response: {str(e)}")
            return {
                "emergingNeeds": [],
                "patterns": [],
                "trends": [],
                "gaps": [],
                "recommendations": [],
                "overallConfidence": 0,
                "rawResponse": response
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
    
    def _get_sentiment_distribution(self, requests: List[CustomerRequest]) -> Dict[str, int]:
        """Get sentiment distribution (simplified)"""
        return {
            "positive": len([r for r in requests if "enhance" in r.description.lower() or "improve" in r.description.lower()]),
            "neutral": len([r for r in requests if "request" in r.description.lower() or "need" in r.description.lower()]),
            "negative": len([r for r in requests if "issue" in r.description.lower() or "problem" in r.description.lower()])
        }

class ResultConsolidator:
    def __init__(self):
        self.name = "Result Consolidator"
    
    def consolidate_results(self, section_results: List[AnalysisResult]) -> Dict[str, Any]:
        """Consolidate results from all sections"""
        logger.info(f"Consolidating results from {len(section_results)} sections")
        
        # Merge all emerging needs
        all_emerging_needs = []
        for result in section_results:
            all_emerging_needs.extend(result.emerging_needs)
        
        # Merge all patterns
        all_patterns = []
        for result in section_results:
            all_patterns.extend(result.patterns)
        
        # Merge all trends
        all_trends = []
        for result in section_results:
            all_trends.extend(result.trends)
        
        # Merge all gaps
        all_gaps = []
        for result in section_results:
            all_gaps.extend(result.gaps)
        
        # Merge all recommendations
        all_recommendations = []
        for result in section_results:
            all_recommendations.extend(result.recommendations)
        
        # Calculate overall metrics
        total_confidence = sum(result.overall_confidence for result in section_results) / len(section_results)
        total_processing_time = sum(result.processing_time for result in section_results)
        total_data_points = sum(result.data_points_analyzed for result in section_results)
        
        # Deduplicate and rank results
        consolidated = {
            "emergingNeeds": self._deduplicate_and_rank(all_emerging_needs, "need"),
            "patterns": self._deduplicate_and_rank(all_patterns, "pattern"),
            "trends": self._deduplicate_and_rank(all_trends, "trend"),
            "gaps": self._deduplicate_and_rank(all_gaps, "gap"),
            "recommendations": self._deduplicate_and_rank(all_recommendations, "recommendation"),
            "overallConfidence": total_confidence,
            "totalProcessingTime": total_processing_time,
            "totalDataPoints": total_data_points,
            "sectionsProcessed": len(section_results),
            "consolidationTimestamp": datetime.now().isoformat()
        }
        
        logger.info(f"Consolidation complete. Total confidence: {total_confidence:.2f}")
        return consolidated
    
    def _deduplicate_and_rank(self, items: List[Dict[str, Any]], key_field: str) -> List[Dict[str, Any]]:
        """Deduplicate and rank items by confidence/frequency"""
        # Group by key field
        grouped = {}
        for item in items:
            key = item.get(key_field, "").lower().strip()
            if key not in grouped:
                grouped[key] = []
            grouped[key].append(item)
        
        # Merge and rank
        merged = []
        for key, group in grouped.items():
            if not key:
                continue
                
            # Take the item with highest confidence
            best_item = max(group, key=lambda x: x.get("confidence", 0))
            
            # Sum up frequencies if they exist
            if "frequency" in best_item:
                best_item["frequency"] = sum(item.get("frequency", 0) for item in group)
            if "occurrences" in best_item:
                best_item["occurrences"] = sum(item.get("occurrences", 0) for item in group)
            
            merged.append(best_item)
        
        # Sort by confidence and return top 10
        return sorted(merged, key=lambda x: x.get("confidence", 0), reverse=True)[:10]

# API Endpoints

@app.get("/")
async def root():
    return {"message": "ServiceNow Accelerator AI Backend", "status": "running"}

@app.post("/analyze-parallel")
async def analyze_parallel(
    requests: List[CustomerRequest],
    accelerators: List[Accelerator],
    background_tasks: BackgroundTasks
):
    """Analyze customer requests in parallel across 5 sections"""
    try:
        logger.info(f"Starting parallel analysis with {len(requests)} requests and {len(accelerators)} accelerators")
        
        # Split requests into 5 sections
        section_size = len(requests) // 5
        sections = []
        for i in range(5):
            start_idx = i * section_size
            end_idx = start_idx + section_size if i < 4 else len(requests)
            sections.append(requests[start_idx:end_idx])
        
        # Create agents for each section
        agents = [ParallelAcceleratorAgent(i + 1) for i in range(5)]
        
        # Run analysis in parallel
        tasks = [
            agent.analyze_section(section, accelerators) 
            for agent, section in zip(agents, sections)
        ]
        
        # Wait for all tasks to complete
        section_results = await asyncio.gather(*tasks)
        
        # Store individual results
        for result in section_results:
            analysis_results[result.section_id] = result
        
        # Consolidate results
        consolidator = ResultConsolidator()
        consolidated_analysis = consolidator.consolidate_results(section_results)
        
        # Create final result
        global consolidated_result
        consolidated_result = ConsolidatedResult(
            consolidated_analysis=consolidated_analysis,
            section_results=section_results,
            total_processing_time=sum(r.processing_time for r in section_results),
            total_data_points=sum(r.data_points_analyzed for r in section_results),
            timestamp=datetime.now().isoformat()
        )
        
        logger.info(f"Parallel analysis complete. Total time: {consolidated_result.total_processing_time:.2f}s")
        
        return {
            "status": "success",
            "message": f"Analysis completed for {len(requests)} requests across 5 sections",
            "consolidated_result": consolidated_result,
            "section_results": section_results
        }
        
    except Exception as e:
        logger.error(f"Error in parallel analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/results")
async def get_results():
    """Get consolidated analysis results"""
    if consolidated_result is None:
        raise HTTPException(status_code=404, detail="No analysis results available")
    
    return consolidated_result

@app.get("/results/{section_id}")
async def get_section_results(section_id: int):
    """Get results for a specific section"""
    if section_id not in analysis_results:
        raise HTTPException(status_code=404, detail=f"No results found for section {section_id}")
    
    return analysis_results[section_id]

@app.get("/status")
async def get_status():
    """Get system status"""
    return {
        "status": "running",
        "sections_processed": len(analysis_results),
        "has_consolidated_result": consolidated_result is not None,
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
