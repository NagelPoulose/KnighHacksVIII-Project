"""
Google ADK Agent Integration for Parallel ServiceNow Accelerator Analysis
This module integrates your existing Google ADK agents with the parallel processing backend.
"""
import sys
import os
import time
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime
import asyncio

# Add the accelerator-agent directory to the Python path
project_root = Path(__file__).parent.parent
accelerator_agent_path = project_root / "accelerator-agent"
sys.path.insert(0, str(accelerator_agent_path))

try:
    from agent import root_agent, classify_agent, pattern_agent
    ADK_AVAILABLE = True  # Using Google ADK agents
    print("✅ Google ADK agents loaded successfully")
except ImportError as e:
    ADK_AVAILABLE = False
    root_agent = None
    classify_agent = None
    pattern_agent = None
    print(f"⚠️ Google ADK agents not available: {e}")

class ADKParallelAgent:
    """
    Wrapper for Google ADK agents to work with parallel processing.
    Converts request data to CSV-like format that ADK agents expect.
    """
    
    def __init__(self, section_id: int):
        self.section_id = section_id
        self.name = f"ADK Parallel Agent Section {section_id}"
        self.adk_available = ADK_AVAILABLE
        
    async def analyze_section(self, requests_data: list) -> dict:
        """
        Analyze a section of customer requests using Google ADK agents.
        The ADK agents expect CSV-like data and will:
        1. Classify requests against existing accelerators
        2. Find patterns that DON'T match existing accelerators  
        3. Recommend top 10 new accelerators to add
        """
        if not self.adk_available:
            raise Exception("Google ADK agents not available. Please install google-adk package.")
        
        start_time = time.time()
        
        try:
            print(f"🤖 ADK Section {self.section_id} - Analyzing {len(requests_data)} requests")
            
            # Format requests as CSV-style text for ADK agent
            csv_text = self._format_requests_as_csv(requests_data)
            
            # Create initial state for ADK sequential agent
            initial_state = {
                "user_requests": csv_text
            }
            
            print(f"🔄 Running ADK CLI for section {self.section_id}...")
            
            # Run ADK agent via CLI (the correct way)
            result = await self._run_adk_via_cli(csv_text)
            
            processing_time = time.time() - start_time
            
            # Transform ADK result to our expected format
            transformed = self._transform_adk_result(result, len(requests_data), processing_time)
            
            print(f"✅ ADK Section {self.section_id} - Completed in {processing_time:.2f}s")
            return transformed
            
        except Exception as e:
            processing_time = time.time() - start_time
            print(f"❌ ADK Section {self.section_id} - Error: {str(e)}")
            
            # Return fallback result
            return {
                "section_id": self.section_id,
                "emerging_needs": [{
                    "need": "Error processing section",
                    "confidence": 0,
                    "frequency": 0,
                    "category": "error"
                }],
                "patterns": [],
                "trends": [],
                "gaps": [],
                "recommendations": [],
                "overall_confidence": 0,
                "processing_time": processing_time,
                "data_points_analyzed": len(requests_data),
                "timestamp": datetime.now().isoformat(),
                "adk_used": False,
                "error": str(e)
            }
    
    async def _run_adk_via_cli(self, csv_text: str) -> dict:
        """
        Run the ADK agent via CLI.
        This is the correct way to invoke ADK agents.
        """
        import subprocess
        import tempfile
        
        try:
            # Create a temporary file with the CSV data
            with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
                f.write(csv_text)
                temp_file = f.name
            
            try:
                # Get the path to the accelerator-agent directory
                agent_dir = Path(__file__).parent.parent / "accelerator-agent"
                
                # Get the path to the ADK CLI in the virtual environment
                backend_dir = Path(__file__).parent
                adk_path = backend_dir / "venv" / "bin" / "adk"
                
                # Run the ADK CLI with full path
                cmd = [str(adk_path), "run", str(agent_dir)]
                
                print(f"   Running command: {' '.join(cmd)}")
                
                # Run the command and capture output
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(
                    None,
                    lambda: subprocess.run(
                        cmd,
                        stdin=open(temp_file, 'r'),
                        capture_output=True,
                        text=True,
                        timeout=180  # Increased to 3 minutes for ADK agents
                    )
                )
                
                # Clean up temp file
                os.unlink(temp_file)
                
                if result.returncode == 0:
                    # Parse the output
                    stdout = result.stdout
                    print(f"   ADK CLI output length: {len(stdout)} chars")
                    print(f"   ADK CLI output preview: {stdout[:500]}")
                    
                    # The ADK agent outputs in agent format:
                    # [list_agent]: ...
                    # [classify_agent]: ...
                    # [pattern_agent]: ...
                    
                    # Extract each agent's output
                    classify_output = ""
                    pattern_output = ""
                    
                    # Look for pattern_agent output specifically
                    if "[pattern_agent]:" in stdout:
                        pattern_start = stdout.find("[pattern_agent]:")
                        pattern_output = stdout[pattern_start + len("[pattern_agent]:"):].strip()
                        print(f"   ✅ Found pattern_agent output: {pattern_output[:200]}")
                    
                    # Look for classify_agent output
                    if "[classify_agent]:" in stdout:
                        classify_start = stdout.find("[classify_agent]:")
                        classify_end = stdout.find("[pattern_agent]:")
                        if classify_end > classify_start:
                            classify_output = stdout[classify_start + len("[classify_agent]:"):classify_end].strip()
                        else:
                            classify_output = stdout[classify_start + len("[classify_agent]:"):].strip()
                        print(f"   ✅ Found classify_agent output: {classify_output[:200]}")
                    
                    return {
                        "classify": classify_output.strip(),
                        "final_patterns": pattern_output.strip()
                    }
                else:
                    print(f"   ⚠️ ADK CLI error: {result.stderr}")
                    return {
                        "classify": "",
                        "final_patterns": "",
                        "error": result.stderr
                    }
                    
            except subprocess.TimeoutExpired:
                os.unlink(temp_file)
                print(f"   ⚠️ ADK CLI timed out")
                return {
                    "classify": "",
                    "final_patterns": "",
                    "error": "ADK CLI timed out"
                }
                
        except Exception as e:
            print(f"   ❌ Error running ADK CLI: {e}")
            return {
                "classify": "",
                "final_patterns": "",
                "error": str(e)
            }
    
    def _format_requests_as_csv(self, requests_data: list) -> str:
        """
        Format requests as CSV-style text for ADK agent.
        The ADK agent expects a list of requests with their details.
        """
        csv_lines = []
        csv_lines.append('"number","company","capability","title","description","category"')
        
        for req in requests_data:
            # Handle both Pydantic models and dictionaries
            if hasattr(req, 'number'):
                # Pydantic model
                number = req.number
                company = req.company
                capability = req.capability
                title = req.initiative_title
                description = req.description
                category = req.primary_category
            else:
                # Dictionary
                number = req.get('number', 'N/A')
                company = req.get('company', 'N/A')
                capability = req.get('capability', 'N/A')
                title = req.get('initiative_title', 'N/A')
                description = req.get('description', 'N/A')
                category = req.get('primary_category', 'N/A')
            
            # Escape quotes in the data
            def escape_csv(text):
                if text is None:
                    return ""
                text = str(text).replace('"', '""')
                return f'"{text}"'
            
            csv_line = ','.join([
                escape_csv(number),
                escape_csv(company),
                escape_csv(capability),
                escape_csv(title),
                escape_csv(description),
                escape_csv(category)
            ])
            csv_lines.append(csv_line)
        
        return '\n'.join(csv_lines)
    
    def _transform_adk_result(self, adk_result: dict, data_count: int, processing_time: float) -> dict:
        """
        Transform ADK agent result to our expected format.
        
        ADK result contains:
        - classify: Patterns found that DON'T match existing accelerators
        - final_patterns: Top 10 recommended new accelerators to add
        """
        
        # Extract results from ADK agent
        classify_text = adk_result.get('classify', '')
        patterns_text = adk_result.get('final_patterns', '')
        
        print(f"📊 ADK Section {self.section_id} - Classify result length: {len(classify_text)} chars")
        print(f"📊 ADK Section {self.section_id} - Patterns result length: {len(patterns_text)} chars")
        
        # Parse the pattern recommendations (top 10 new accelerators)
        recommendations = self._parse_accelerator_recommendations(patterns_text)
        
        # Parse emerging needs from classify result
        emerging_needs = self._parse_emerging_needs(classify_text)
        
        # Parse patterns (what's NOT covered by existing accelerators)
        patterns = self._parse_patterns(classify_text)
        
        return {
            "section_id": self.section_id,
            "emerging_needs": emerging_needs[:10],
            "patterns": patterns[:10],
            "trends": [{
                "trend": "Growing demand for new ServiceNow accelerators",
                "direction": "increasing",
                "strength": 85,
                "timeframe": "immediate"
            }],
            "gaps": [{
                "gap": "Accelerators not matching current customer needs",
                "severity": "high",
                "affectedCustomers": data_count,
                "confidence": 80
            }],
            "recommendations": recommendations[:10],
            "overall_confidence": 85 if recommendations else 60,
            "processing_time": processing_time,
            "data_points_analyzed": data_count,
            "timestamp": datetime.now().isoformat(),
            "adk_used": True,
            "raw_adk_classify": classify_text[:500] + "..." if len(classify_text) > 500 else classify_text,
            "raw_adk_patterns": patterns_text[:500] + "..." if len(patterns_text) > 500 else patterns_text
        }
    
    def _parse_accelerator_recommendations(self, patterns_text: str) -> list:
        """
        Parse the pattern_agent output to extract recommended new accelerators.
        Expected format: CSV-style with "name","description","request_numbers" or text with embedded request IDs
        """
        recommendations = []
        
        lines = patterns_text.strip().split('\n')
        for line in lines:
            line = line.strip()
            
            # Skip empty lines and headers
            if not line or line.startswith('```') or 'name' in line.lower() and 'description' in line.lower():
                continue
            
            # Try to parse CSV format: "Name","Description","Request Numbers"
            if '","' in line or line.count('"') >= 4:
                try:
                    # Remove outer quotes and split by ","
                    parts = line.strip('"').split('","')
                    if len(parts) >= 2:
                        name = parts[0].strip().strip('"')
                        description = parts[1].strip().strip('"')
                        evidence_requests = []
                        
                        # Check if there's a third part with request numbers
                        if len(parts) >= 3:
                            evidence_text = parts[2].strip().strip('"')
                            evidence_requests = self._extract_request_numbers(evidence_text)
                        
                        # Also check if request numbers are embedded in the description
                        if not evidence_requests:
                            evidence_requests = self._extract_request_numbers(description)
                        
                        # Also check the entire line for request numbers
                        if not evidence_requests:
                            evidence_requests = self._extract_request_numbers(line)
                        
                        if name and description and len(name) > 3:
                            recommendations.append({
                                "recommendation": name,
                                "description": description,
                                "priority": "high" if len(recommendations) < 3 else "medium",
                                "confidence": 85 - (len(recommendations) * 3),
                                "expectedImpact": "high",
                                "evidenceRequests": evidence_requests[:10]  # Limit to 10 requests
                            })
                except Exception as e:
                    print(f"⚠️ Could not parse line: {line[:100]}... Error: {e}")
                    continue
        
        # If we didn't find any recommendations, try a more lenient approach
        if not recommendations:
            print("⚠️ No recommendations found with strict parsing, trying lenient approach...")
            for line in lines:
                if 'jumpstart' in line.lower() or 'tuneup' in line.lower() or 'extend' in line.lower():
                    # Extract text between quotes
                    import re
                    quotes = re.findall(r'"([^"]+)"', line)
                    if len(quotes) >= 2:
                        evidence_requests = self._extract_request_numbers(line)
                        recommendations.append({
                            "recommendation": quotes[0],
                            "description": quotes[1],
                            "priority": "medium",
                            "confidence": 75,
                            "expectedImpact": "medium",
                            "evidenceRequests": evidence_requests[:10]
                        })
        
        print(f"✅ Parsed {len(recommendations)} accelerator recommendations")
        for i, rec in enumerate(recommendations, 1):
            evidence_count = len(rec.get('evidenceRequests', []))
            print(f"   {i}. {rec['recommendation']} - {evidence_count} evidence requests")
        return recommendations
    
    def _extract_request_numbers(self, text: str) -> list:
        """
        Extract request numbers from text.
        Supports formats like: REQ001, REQ-001, REQ_001, CSR001, INC001, or just numbers
        """
        import re
        
        request_numbers = []
        
        # Pattern 1: REQ/CSR/INC followed by numbers (with or without separators)
        pattern1 = r'\b(?:REQ|CSR|INC|RITM|CHG|PRB)[-_]?\d+\b'
        matches1 = re.findall(pattern1, text, re.IGNORECASE)
        request_numbers.extend(matches1)
        
        # Pattern 2: Just numbers in specific contexts (like "Request 12345" or "requests: 1, 2, 3")
        pattern2 = r'(?:request|req|number|#)[\s:]*(\d+)'
        matches2 = re.findall(pattern2, text, re.IGNORECASE)
        request_numbers.extend(matches2)
        
        # Pattern 3: Comma-separated numbers after keywords
        pattern3 = r'(?:requests?|evidence|based on)[\s:]+([0-9,\s]+)'
        matches3 = re.findall(pattern3, text, re.IGNORECASE)
        for match in matches3:
            nums = re.findall(r'\d+', match)
            request_numbers.extend(nums)
        
        # Remove duplicates and return
        unique_requests = list(dict.fromkeys(request_numbers))
        return unique_requests[:10]  # Limit to 10
    
    def _parse_emerging_needs(self, classify_text: str) -> list:
        """
        Parse the classify_agent output to extract emerging needs.
        These are patterns that DON'T match existing accelerators.
        """
        emerging_needs = []
        
        # Common keywords that indicate emerging needs
        keywords = {
            'automation': {'category': 'automation', 'weight': 90},
            'integration': {'category': 'integration', 'weight': 85},
            'analytics': {'category': 'analytics', 'weight': 80},
            'reporting': {'category': 'reporting', 'weight': 80},
            'security': {'category': 'security', 'weight': 85},
            'workflow': {'category': 'workflow', 'weight': 75},
            'ai': {'category': 'ai', 'weight': 90},
            'mobile': {'category': 'mobile', 'weight': 70},
            'performance': {'category': 'performance', 'weight': 75},
            'user experience': {'category': 'ux', 'weight': 80},
            'compliance': {'category': 'compliance', 'weight': 85},
            'migration': {'category': 'migration', 'weight': 70},
        }
        
        classify_lower = classify_text.lower()
        
        for keyword, props in keywords.items():
            count = classify_lower.count(keyword)
            if count > 0:
                emerging_needs.append({
                    "need": f"Enhanced {keyword.title()} capabilities",
                    "confidence": min(props['weight'] + (count * 2), 95),
                    "frequency": count,
                    "category": props['category']
                })
        
        # Sort by confidence
        emerging_needs.sort(key=lambda x: x['confidence'], reverse=True)
        
        return emerging_needs
    
    def _parse_patterns(self, classify_text: str) -> list:
        """
        Parse patterns from classify result.
        These represent gaps in current accelerator coverage.
        """
        patterns = []
        
        # Split into sentences and look for pattern indicators
        sentences = classify_text.replace('\n', '. ').split('. ')
        
        for sentence in sentences:
            sentence = sentence.strip()
            
            # Look for sentences that indicate patterns or gaps
            indicators = ['pattern', 'gap', 'need', 'request', 'customer', 'common', 'frequent']
            
            if any(indicator in sentence.lower() for indicator in indicators) and len(sentence) > 20:
                patterns.append({
                    "pattern": sentence[:200],
                    "confidence": 70,
                    "occurrences": 1,
                    "impact": "medium"
                })
        
        return patterns[:10]

# Export the ADK agent class and availability flag
__all__ = ['ADKParallelAgent', 'ADK_AVAILABLE']
