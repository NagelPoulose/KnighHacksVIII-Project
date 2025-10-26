// Unified AI Analyzer - Does classification AND matching in ONE API call
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

class UnifiedAnalyzer {
    constructor() {
        this.analysisCache = new Map();
        this.loadCacheFromStorage();
    }

    loadCacheFromStorage() {
        try {
            const stored = localStorage.getItem('unifiedAnalysis');
            if (stored) {
                const data = JSON.parse(stored);
                Object.entries(data).forEach(([key, value]) => {
                    this.analysisCache.set(key, value);
                });
                console.log('✅ Loaded', this.analysisCache.size, 'unified analyses from cache');
            }
        } catch (error) {
            console.error('Failed to load analysis cache:', error);
        }
    }

    saveCacheToStorage() {
        try {
            const data = {};
            this.analysisCache.forEach((value, key) => {
                data[key] = value;
            });
            localStorage.setItem('unifiedAnalysis', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save analysis cache:', error);
        }
    }

    /**
     * Analyzes a request: classifies it AND matches it to accelerators in ONE call
     * @param {Object} request - The customer request
     * @param {Array} accelerators - List of existing accelerators
     * @returns {Object} - Complete analysis with classification and matching
     */
    async analyzeRequest(request, accelerators) {
        const cacheKey = `${request.number || request.id}`;
        
        if (this.analysisCache.has(cacheKey)) {
            console.log('📦 Using cached analysis for:', cacheKey);
            return this.analysisCache.get(cacheKey);
        }

        try {
            const prompt = `You are analyzing a ServiceNow customer request and comparing it against ${accelerators.length} existing accelerators.

CUSTOMER REQUEST:
- Number: ${request.number || request.id || 'N/A'}
- Title: ${request.short_description || request.title || 'N/A'}
- Description: ${request.description || request.u_description || 'N/A'}
- Capability: ${request.capability || 'N/A'}

EXISTING ACCELERATORS (${accelerators.length} total - EVALUATE EACH ONE):
${JSON.stringify(accelerators.map(a => ({
  name: a.name,
  description: a.description,
  category: a.category
})), null, 2)}

YOUR TASK - CRITICAL: You MUST evaluate EVERY SINGLE accelerator above and provide a matchScore (0-100) for each.

STEP 1 - CLASSIFICATION: Assign priority, complexity, and category based on the request text.

STEP 2 - REQUIREMENTS: Extract 3-10 MUST-HAVEs (core requirements) and 0-8 NICE-TO-HAVEs (optional enhancements).

STEP 3 - ACCELERATOR EVALUATION (THIS IS CRITICAL):
For EACH of the ${accelerators.length} accelerators listed above:
- Compare it against the customer request requirements
- Calculate matchScore (0-100) based on how well it covers the MUST-HAVEs and NICE-TO-HAVEs
- Provide reasoning for why this accelerator matches or doesn't match
- Match score should be:
  * 80-100: Excellent match - covers most MUST-HAVEs
  * 50-79: Partial match - covers some requirements
  * 0-49: Poor match - minimal or no relevant overlap

STEP 4 - SELECTION: From the accelerators you evaluated, select the best combination (0-N) that together fulfill the request with minimal redundancy.

STEP 5 - DECISION: Can this request be fulfilled by existing accelerators? If yes, how? If no, what's missing?

RETURN JSON ONLY (no markdown):
{
  "classification": {
    "priority": "high/medium/low",
    "priorityReasoning": "Brief explanation",
    "complexity": "high/medium/low",
    "complexityReasoning": "Brief explanation",
    "category": "Automation/Integration/Reporting/Security/User Experience/General",
    "categoryReasoning": "Brief explanation",
    "confidenceScore": 70
  },
  "matching": {
    "mustHaves": ["req1", "req2", "req3"],
    "niceToHaves": ["opt1", "opt2"],
    "evaluatedAccelerators": [
      {
        "name": "Accelerator Name",
        "matchScore": 85,
        "coverageLevel": "full/partial/minimal",
        "covers": {"mustHaves": ["req1"], "niceToHaves": []},
        "evidenceCount": 3,
        "reasoning": "How this accelerator relates to the request",
        "assumptions": "",
        "disqualifiersTriggered": [],
        "estimatedHumanEffortHours": 16,
        "riskFlags": []
      }
      // MANDATORY: Include ALL ${accelerators.length} accelerators in this array
      // Each accelerator must have a matchScore (0-100)
      // Even if matchScore is 0, still include it with reasoning why it doesn't match
    ],
    "selectedAccelerators": [
      {
        "name": "Accelerator Name",
        "covers": {"mustHaves": ["req1"], "niceToHaves": []},
        "marginalUtility": 75,
        "utilityContributionBreakdown": {
          "coverageUtility": 80,
          "redundancyPenalty": 2,
          "conflictPenalty": 0,
          "effortCost": 16,
          "riskPenalty": 0
        },
        "estimatedHumanEffortHours": 16,
        "reasoning": "Why selected"
      }
    ],
    "setCoveragePercent": 85,
    "effortCostTotalHours": 32,
    "redundancyNotes": "",
    "conflictNotes": "",
    "canBeFulfilled": true,
    "overallConfidence": 80,
    "gapAnalysis": "Any gaps in coverage",
    "recommendation": "Implementation plan or new accelerator proposal",
    "implementationPlan": ["Step 1", "Step 2"],
    "diagnostics": {
      "stoppingCondition": "Why selection stopped",
      "runnerUpSetUtilityMargin": "Margin vs alternative",
      "notes": "Brief trace"
    }
  }
}

IMPORTANT REMINDERS:
1. You MUST include ALL ${accelerators.length} accelerators in the "evaluatedAccelerators" array
2. Each accelerator must have a matchScore (0-100) based on how well it addresses the request requirements
3. Match scores: 80-100 = excellent, 50-79 = partial, 0-49 = poor
4. Return ONLY valid JSON - no markdown, no additional text
5. Be thorough and honest in your evaluation - even accelerators with low match scores should be included`;

            console.log('🤖 Unified AI Analysis for:', request.number || request.id);
            const response = await this.callGoogleAI(prompt);
            console.log('📥 Received response from Gemini, length:', response.length);
            const analysis = this.parseAnalysis(response);
            
            console.log('✅ Parsed analysis, keys:', Object.keys(analysis));
            
            // Add metadata
            analysis.requestId = cacheKey;
            analysis.analyzedAt = new Date().toISOString();
            
            // Cache the result
            this.analysisCache.set(cacheKey, analysis);
            this.saveCacheToStorage();
            
            console.log('✅ Unified analysis complete for:', cacheKey);
            console.log('✅ Cached analysis to Map, cache size:', this.analysisCache.size);
            return analysis;
            
        } catch (error) {
            console.error('❌ Unified analysis error:', error);
            return this.fallbackAnalysis(request, accelerators);
        }
    }

    /**
     * Batch analyze multiple requests
     */
    async batchAnalyze(requests, accelerators, onProgress = null) {
        const results = [];
        
        for (let i = 0; i < requests.length; i++) {
            const request = requests[i];
            const analysis = await this.analyzeRequest(request, accelerators);
            results.push(analysis);
            
            if (onProgress) {
                onProgress({
                    processed: i + 1,
                    total: requests.length,
                    percentage: Math.round(((i + 1) / requests.length) * 100)
                });
            }
            
            // 6 second delay = 10 requests per minute (at 10 RPM limit)
            if (i + 1 < requests.length) {
                await new Promise(resolve => setTimeout(resolve, 6000));
            }
        }
        
        return results;
    }

    async callGoogleAI(prompt) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.5,
                    maxOutputTokens: 8192
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error Response:', errorText);
            throw new Error(`Google AI API error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        // Check if finish reason is MAX_TOKENS
        if (data.candidates && data.candidates[0] && data.candidates[0].finishReason === 'MAX_TOKENS') {
            console.warn('⚠️ Response hit MAX_TOKENS limit - trying to parse truncated JSON');
        }
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error('❌ Unexpected API response structure:', data);
            throw new Error('Unexpected API response structure');
        }
        
        if (!data.candidates[0].content.parts || !data.candidates[0].content.parts[0] || !data.candidates[0].content.parts[0].text) {
            console.error('❌ No text content in response:', data);
            throw new Error('No text content in API response');
        }
        
        return data.candidates[0].content.parts[0].text;
    }

    parseAnalysis(response) {
        try {
            console.log('🔍 Raw AI response:', response.substring(0, 500) + '...');
            
            // Extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                let jsonStr = jsonMatch[0];
                
                // Try to fix truncated JSON by closing open structures
                try {
                    JSON.parse(jsonStr);
                } catch (e) {
                    console.warn('⚠️ JSON is truncated, attempting to fix...');
                    // Try to close the JSON properly
                    let openBraces = (jsonStr.match(/\{/g) || []).length;
                    let closeBraces = (jsonStr.match(/\}/g) || []).length;
                    let openBrackets = (jsonStr.match(/\[/g) || []).length;
                    let closeBrackets = (jsonStr.match(/\]/g) || []).length;
                    
                    // Add missing closing brackets/braces
                    jsonStr += ']'.repeat(Math.max(0, openBrackets - closeBrackets));
                    jsonStr += '}'.repeat(Math.max(0, openBraces - closeBraces));
                    console.log('🔧 Attempted to fix JSON');
                }
                
                const parsed = JSON.parse(jsonStr);
                console.log('✅ Parsed JSON successfully');
                
                // Transform selectedAccelerators to old format for compatibility
                const selectedAccelerators = parsed.matching?.selectedAccelerators || [];
                const transformedAccelerators = selectedAccelerators.map(acc => ({
                    name: acc.name,
                    matchScore: acc.utilityContributionBreakdown?.coverageUtility || 70,
                    reasoning: acc.reasoning || 'Selected based on utility analysis',
                    coverageLevel: acc.coverageLevel || 'partial',
                    marginalUtility: acc.marginalUtility,
                    estimatedEffortHours: acc.estimatedHumanEffortHours
                }));
                
                console.log('📊 Transformed accelerators:', transformedAccelerators.length);
                
                return {
                    // Classification data
                    priority: parsed.classification?.priority || 'medium',
                    priorityReasoning: parsed.classification?.priorityReasoning || 'No reasoning provided',
                    complexity: parsed.classification?.complexity || 'medium',
                    complexityReasoning: parsed.classification?.complexityReasoning || 'No reasoning provided',
                    category: parsed.classification?.category || 'General',
                    categoryReasoning: parsed.classification?.categoryReasoning || 'No reasoning provided',
                    classificationConfidence: parsed.classification?.confidenceScore || 70,
                    
                    // Matching data (new format)
                    mustHaves: parsed.matching?.mustHaves || [],
                    niceToHaves: parsed.matching?.niceToHaves || [],
                    evaluatedAccelerators: parsed.matching?.evaluatedAccelerators || [],
                    selectedAccelerators: transformedAccelerators,
                    setCoveragePercent: parsed.matching?.setCoveragePercent || 0,
                    effortCostTotalHours: parsed.matching?.effortCostTotalHours || 0,
                    redundancyNotes: parsed.matching?.redundancyNotes || '',
                    conflictNotes: parsed.matching?.conflictNotes || '',
                    implementationPlan: parsed.matching?.implementationPlan || [],
                    diagnostics: parsed.matching?.diagnostics || {},
                    
                    // Legacy compatibility fields
                    canBeFulfilled: parsed.matching?.canBeFulfilled || false,
                    matchingAccelerators: transformedAccelerators,
                    overallConfidence: parsed.matching?.overallConfidence || 0,
                    gapAnalysis: parsed.matching?.gapAnalysis || 'No gap analysis provided',
                    recommendation: parsed.matching?.recommendation || 'No recommendation provided'
                };
            }
            throw new Error('No JSON found in response');
        } catch (error) {
            console.error('❌ Error parsing unified analysis:', error);
            console.error('Response was:', response.substring(0, 1000));
            throw error;
        }
    }

    fallbackAnalysis(request, accelerators) {
        console.warn('⚠️ Using fallback analysis (AI failed)');
        
        const text = `${request.description || ''} ${request.capability || ''}`.toLowerCase();
        
        return {
            priority: 'medium',
            priorityReasoning: 'Fallback: Unable to determine priority via AI',
            complexity: 'medium',
            complexityReasoning: 'Fallback: Unable to determine complexity via AI',
            category: 'General',
            categoryReasoning: 'Fallback: Unable to determine category via AI',
            classificationConfidence: 40,
            canBeFulfilled: false,
            matchingAccelerators: [],
            overallConfidence: 0,
            gapAnalysis: 'AI analysis unavailable - manual review required',
            recommendation: 'Manual review needed due to AI analysis failure',
            usedFallback: true,
            fallbackReason: 'AI analysis failed'
        };
    }
}

export default UnifiedAnalyzer;

