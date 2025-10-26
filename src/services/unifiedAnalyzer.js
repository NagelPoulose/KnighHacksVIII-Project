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
            const prompt = `
You are an expert ServiceNow AI Agent. Analyze this customer request and perform TWO tasks in ONE response:

TASK 1: CLASSIFY the request
TASK 2: MATCH it against existing accelerators

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CUSTOMER REQUEST:
- Number: ${request.number || request.id || 'N/A'}
- Title: ${request.short_description || request.title || 'N/A'}
- Description: ${request.description || request.u_description || 'N/A'}
- Capability Area: ${request.capability || 'N/A'}
- Company: ${request.company || 'N/A'}

EXISTING ACCELERATORS (${accelerators.length} total):
${JSON.stringify(accelerators.map(a => ({
    name: a.name,
    description: a.description,
    category: a.category
})), null, 2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TASK 1 - CLASSIFICATION:
Classify the request's priority, complexity, and category with detailed reasoning:

PRIORITY (high/medium/low):
- HIGH: Critical business operations, security risks, regulatory compliance, revenue impact, 100+ users affected, system downtime
- MEDIUM: Team efficiency (10-100 users), flexible timeline (1-3 months), enhances existing features
- LOW: Cosmetic/nice-to-have, <10 users, no deadline, minor enhancements

COMPLEXITY (high/medium/low):
- HIGH: Custom development, multiple integrations, architectural changes, 4+ weeks work, complex business logic
- MEDIUM: Moderate customization (2-4 weeks), some scripting, 1-2 integrations, cross-team coordination  
- LOW: Out-of-box features, simple config (<1 week), minimal code, uses existing accelerators

CATEGORY: Automation, Integration, Reporting, Security, User Experience, or General

TASK 2 - MATCHING:
Analyze which existing accelerators (if any) can fulfill this request. For each relevant accelerator:
- Provide match score (0-100)
- Explain HOW it helps (specific reasoning)
- Assess coverage level (full/partial/minimal)
- Identify what's MISSING (gap analysis)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Respond in this EXACT JSON format:
{
    "classification": {
        "priority": "high/medium/low",
        "priorityReasoning": "Explain WHY this priority based on user impact, timeline, business criticality",
        "complexity": "high/medium/low",
        "complexityReasoning": "Explain WHY this complexity based on technical requirements, integrations, development time",
        "category": "Automation/Integration/Reporting/Security/User Experience/General",
        "categoryReasoning": "Explain WHY this category was chosen",
        "confidenceScore": 85
    },
    "matching": {
        "canBeFulfilled": true,
        "matchingAccelerators": [
            {
                "name": "Accelerator Name",
                "matchScore": 85,
                "reasoning": "Specific explanation of HOW this accelerator helps with this request",
                "coverageLevel": "full"
            }
        ],
        "overallConfidence": 85,
        "gapAnalysis": "Detailed explanation of what aspects are NOT covered by existing accelerators",
        "recommendation": "Should a new accelerator be created? Why or why not?"
    }
}
`;

            console.log('🤖 Unified AI Analysis for:', request.number || request.id);
            const response = await this.callGoogleAI(prompt);
            const analysis = this.parseAnalysis(response);
            
            // Add metadata
            analysis.requestId = cacheKey;
            analysis.analyzedAt = new Date().toISOString();
            
            // Cache the result
            this.analysisCache.set(cacheKey, analysis);
            this.saveCacheToStorage();
            
            console.log('✅ Unified analysis complete for:', cacheKey);
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
                    maxOutputTokens: 3000
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Google AI API error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    parseAnalysis(response) {
        try {
            // Extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    // Classification data
                    priority: parsed.classification?.priority || 'medium',
                    priorityReasoning: parsed.classification?.priorityReasoning || 'No reasoning provided',
                    complexity: parsed.classification?.complexity || 'medium',
                    complexityReasoning: parsed.classification?.complexityReasoning || 'No reasoning provided',
                    category: parsed.classification?.category || 'General',
                    categoryReasoning: parsed.classification?.categoryReasoning || 'No reasoning provided',
                    classificationConfidence: parsed.classification?.confidenceScore || 70,
                    
                    // Matching data
                    canBeFulfilled: parsed.matching?.canBeFulfilled || false,
                    matchingAccelerators: parsed.matching?.matchingAccelerators || [],
                    overallConfidence: parsed.matching?.overallConfidence || 0,
                    gapAnalysis: parsed.matching?.gapAnalysis || 'No gap analysis provided',
                    recommendation: parsed.matching?.recommendation || 'No recommendation provided'
                };
            }
            throw new Error('No JSON found in response');
        } catch (error) {
            console.error('Error parsing unified analysis:', error);
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

