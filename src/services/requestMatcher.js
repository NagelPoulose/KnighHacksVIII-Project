// Request Matcher Service - Matches A2E requests to existing accelerators
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

class RequestMatcher {
    constructor() {
        this.matchCache = new Map();
        this.loadCacheFromStorage();
    }

    loadCacheFromStorage() {
        try {
            const stored = localStorage.getItem('requestMatches');
            if (stored) {
                const data = JSON.parse(stored);
                Object.entries(data).forEach(([key, value]) => {
                    this.matchCache.set(key, value);
                });
                console.log('✅ Loaded', this.matchCache.size, 'match results from cache');
            }
        } catch (error) {
            console.error('Failed to load match cache:', error);
        }
    }

    saveCacheToStorage() {
        try {
            const data = {};
            this.matchCache.forEach((value, key) => {
                data[key] = value;
            });
            localStorage.setItem('requestMatches', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save match cache:', error);
        }
    }

    /**
     * Matches a single request against all accelerators
     * @param {Object} request - The customer request
     * @param {Array} accelerators - List of existing accelerators
     * @returns {Object} - Match result with confidence score
     */
    async matchRequestToAccelerators(request, accelerators) {
        const cacheKey = `${request.id || request.number}`;
        
        if (this.matchCache.has(cacheKey)) {
            console.log('📦 Using cached match for:', cacheKey);
            return this.matchCache.get(cacheKey);
        }

        try {
            // Use AI to determine if any existing accelerator can handle this request
            const prompt = `
You are a ServiceNow Accelerator Matching Agent. Analyze if any existing accelerators can fulfill this customer request.

Customer Request:
- Title: ${request.short_description || request.title || 'N/A'}
- Description: ${request.description || request.u_description || 'N/A'}
- Category: ${request.category || 'N/A'}
- Complexity: ${request.complexity || 'N/A'}

Existing Accelerators:
${JSON.stringify(accelerators.map(a => ({
    name: a.name,
    description: a.description,
    category: a.category
})), null, 2)}

Analyze and respond in JSON format:
{
    "canBeFulfilled": true/false,
    "matchingAccelerators": [
        {
            "name": "Accelerator Name",
            "matchScore": 85,
            "reasoning": "Why this accelerator matches",
            "coverageLevel": "full/partial/minimal"
        }
    ],
    "overallConfidence": 75,
    "gapAnalysis": "What aspects of the request are NOT covered by existing accelerators",
    "recommendation": "Should a new accelerator be created for this type of request?"
}
`;

            const response = await this.callGoogleAI(prompt);
            const matchResult = this.parseMatchResponse(response, request, accelerators);
            
            // Add metadata
            matchResult.requestId = request.id || request.number;
            matchResult.analyzedAt = new Date().toISOString();
            
            // Cache the result
            this.matchCache.set(cacheKey, matchResult);
            this.saveCacheToStorage(); // Persist to localStorage
            
            return matchResult;
        } catch (error) {
            console.error('❌ AI matching error for request:', request.number || request.id, error.message);
            console.warn('⚠️ FALLBACK: Using keyword matching instead of AI');
            // Fallback to simple keyword matching
            const fallbackResult = this.simpleKeywordMatch(request, accelerators);
            fallbackResult.usedFallback = true;
            fallbackResult.fallbackReason = error.message;
            return fallbackResult;
        }
    }

    /**
     * Batch match multiple requests
     * @param {Array} requests - List of customer requests
     * @param {Array} accelerators - List of existing accelerators
     * @returns {Array} - Array of match results
     */
    async batchMatchRequests(requests, accelerators, onProgress = null) {
        const results = [];
        const batchSize = 1; // Process ONE at a time to stay under 15 RPM
        
        for (let i = 0; i < requests.length; i += batchSize) {
            const batch = requests.slice(i, i + batchSize);
            
            const batchPromises = batch.map(request => 
                this.matchRequestToAccelerators(request, accelerators)
            );
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            
            if (onProgress) {
                onProgress({
                    processed: Math.min(i + batchSize, requests.length),
                    total: requests.length,
                    percentage: Math.round((Math.min(i + batchSize, requests.length) / requests.length) * 100)
                });
            }
            
            // 6 second delay = 10 requests per minute (exactly at 10 RPM limit)
            if (i + batchSize < requests.length) {
                await new Promise(resolve => setTimeout(resolve, 6000));
            }
        }
        
        return results;
    }

    /**
     * Fallback keyword-based matching when AI is unavailable
     */
    simpleKeywordMatch(request, accelerators) {
        const requestText = `${request.short_description || ''} ${request.description || request.u_description || ''}`.toLowerCase();
        const matches = [];
        
        accelerators.forEach(acc => {
            const accText = `${acc.name} ${acc.description}`.toLowerCase();
            const accWords = accText.split(/\s+/);
            const requestWords = requestText.split(/\s+/);
            
            // Calculate word overlap
            const overlap = requestWords.filter(word => 
                word.length > 3 && accWords.some(accWord => accWord.includes(word) || word.includes(accWord))
            ).length;
            
            const matchScore = Math.min((overlap / Math.max(requestWords.length, 1)) * 100, 100);
            
            if (matchScore > 20) {
                matches.push({
                    name: acc.name,
                    matchScore: Math.round(matchScore),
                    reasoning: `Keyword overlap detected (${overlap} matching terms)`,
                    coverageLevel: matchScore > 60 ? 'full' : matchScore > 35 ? 'partial' : 'minimal'
                });
            }
        });
        
        matches.sort((a, b) => b.matchScore - a.matchScore);
        
        return {
            requestId: request.id || request.number,
            canBeFulfilled: matches.length > 0 && matches[0].matchScore > 50,
            matchingAccelerators: matches.slice(0, 3),
            overallConfidence: matches.length > 0 ? matches[0].matchScore : 0,
            gapAnalysis: matches.length === 0 ? 'No matching accelerators found' : 'Partial matches available',
            recommendation: matches.length === 0 || matches[0].matchScore < 50 ? 'Consider creating a new accelerator' : 'Existing accelerators may suffice',
            analyzedAt: new Date().toISOString(),
            method: 'keyword-fallback'
        };
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
                    temperature: 0.7,
                    maxOutputTokens: 2000
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Google AI API error: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    parseMatchResponse(response, request, accelerators) {
        try {
            // Extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return parsed;
            }
            throw new Error('No JSON found in response');
        } catch (error) {
            console.error('Error parsing match response:', error);
            // Fallback to keyword matching
            return this.simpleKeywordMatch(request, accelerators);
        }
    }

    /**
     * Analyze gaps across all requests
     */
    analyzeGaps(matchResults) {
        const unmatched = matchResults.filter(r => !r.canBeFulfilled || r.overallConfidence < 50);
        const partiallyMatched = matchResults.filter(r => 
            r.canBeFulfilled && 
            r.overallConfidence >= 50 && 
            r.overallConfidence < 80 &&
            r.matchingAccelerators.some(m => m.coverageLevel === 'partial')
        );
        const fullyMatched = matchResults.filter(r => r.canBeFulfilled && r.overallConfidence >= 80);
        
        return {
            total: matchResults.length,
            unmatched: {
                count: unmatched.length,
                percentage: Math.round((unmatched.length / matchResults.length) * 100),
                requests: unmatched
            },
            partiallyMatched: {
                count: partiallyMatched.length,
                percentage: Math.round((partiallyMatched.length / matchResults.length) * 100),
                requests: partiallyMatched
            },
            fullyMatched: {
                count: fullyMatched.length,
                percentage: Math.round((fullyMatched.length / matchResults.length) * 100),
                requests: fullyMatched
            },
            averageConfidence: Math.round(
                matchResults.reduce((sum, r) => sum + r.overallConfidence, 0) / matchResults.length
            )
        };
    }
}

export default RequestMatcher;

