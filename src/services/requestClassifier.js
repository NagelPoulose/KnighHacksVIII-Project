// AI-Powered Request Classifier using Google Gemini
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

class RequestClassifier {
    constructor() {
        this.classificationCache = new Map();
        this.loadCacheFromStorage();
    }

    loadCacheFromStorage() {
        try {
            const stored = localStorage.getItem('requestClassifications');
            if (stored) {
                const data = JSON.parse(stored);
                Object.entries(data).forEach(([key, value]) => {
                    this.classificationCache.set(key, value);
                });
                console.log('✅ Loaded', this.classificationCache.size, 'classifications from cache');
            }
        } catch (error) {
            console.error('Failed to load cache:', error);
        }
    }

    saveCacheToStorage() {
        try {
            const data = {};
            this.classificationCache.forEach((value, key) => {
                data[key] = value;
            });
            localStorage.setItem('requestClassifications', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save cache:', error);
        }
    }

    /**
     * Uses AI to classify a request's priority, complexity, and category
     * @param {Object} request - The customer request
     * @returns {Object} - Classification results
     */
    async classifyRequest(request) {
        const cacheKey = request.number || request.id;
        
        if (this.classificationCache.has(cacheKey)) {
            console.log('📦 Using cached classification for:', cacheKey);
            return this.classificationCache.get(cacheKey);
        }

        try {
            const prompt = `
You are an expert ServiceNow consultant analyzing customer requests. Based on the request details below, classify the priority, complexity, and category.

Request Details:
- Title: ${request.title || request.initiative_title || 'N/A'}
- Description: ${request.description || 'N/A'}
- Capability Area: ${request.capability || 'N/A'}
- Primary Category: ${request.primary_category || 'N/A'}
- Company: ${request.company || 'N/A'}

Analyze this request and provide a classification with detailed reasoning:

PRIORITY (high/medium/low):
- HIGH: Affects critical business operations, security risks, compliance requirements, revenue impact, affects 100+ users, system downtime, or urgent regulatory needs
- MEDIUM: Improves efficiency for teams (10-100 users), flexible timeline (1-3 months), enhances existing features, moderate business impact
- LOW: Cosmetic/nice-to-have, affects <10 users, no deadline pressure, minor enhancements, can be deferred

COMPLEXITY (high/medium/low):
- HIGH: Requires custom code development, multiple system integrations, architectural changes, affects core platform, 4+ weeks of work, complex business logic
- MEDIUM: Moderate customization (2-4 weeks), configuration of multiple components, some scripting, 1-2 integrations, cross-team coordination
- LOW: Out-of-box features, simple configuration (<1 week), minimal code, uses existing accelerators, basic modifications

CATEGORY:
- Automation: Workflow automation, process optimization, RPA, AI-driven solutions
- Integration: External system connections, APIs, data synchronization
- Reporting: Custom reports, dashboards, analytics, business intelligence
- Security: Access control, authentication, compliance, audit trails
- User Experience: UI/UX improvements, portals, mobile solutions
- General: Spans multiple categories or general platform work

Respond in JSON format:
{
    "priority": "high/medium/low",
    "priorityReasoning": "Explain WHY this priority was assigned based on the criteria above",
    "complexity": "high/medium/low", 
    "complexityReasoning": "Explain WHY this complexity was assigned based on technical requirements",
    "category": "Automation/Integration/Reporting/Security/User Experience/General",
    "categoryReasoning": "Explain WHY this category was chosen",
    "confidenceScore": 85
}
`;

            const response = await this.callGoogleAI(prompt);
            const classification = this.parseClassification(response);
            
            // Add metadata
            classification.classifiedAt = new Date().toISOString();
            classification.requestId = cacheKey;
            
            // Cache the result
            this.classificationCache.set(cacheKey, classification);
            this.saveCacheToStorage(); // Persist to localStorage
            
            return classification;
        } catch (error) {
            console.error('Error classifying request:', error);
            // Fallback to simple classification
            return this.fallbackClassification(request);
        }
    }

    /**
     * Batch classify multiple requests
     */
    async batchClassify(requests, onProgress = null) {
        const results = [];
        const batchSize = 1; // Process ONE at a time to stay under 15 RPM
        
        for (let i = 0; i < requests.length; i += batchSize) {
            const batch = requests.slice(i, i + batchSize);
            
            const batchPromises = batch.map(request => 
                this.classifyRequest(request)
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

    async callGoogleAI(prompt) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_API_KEY}`, {
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
                    temperature: 0.3, // Lower temperature for more consistent classifications
                    maxOutputTokens: 1000
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Google AI API error: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    parseClassification(response) {
        try {
            // Extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    priority: parsed.priority?.toLowerCase() || 'medium',
                    priorityReasoning: parsed.priorityReasoning || 'No reasoning provided',
                    complexity: parsed.complexity?.toLowerCase() || 'medium',
                    complexityReasoning: parsed.complexityReasoning || 'No reasoning provided',
                    category: parsed.category || 'General',
                    categoryReasoning: parsed.categoryReasoning || 'No reasoning provided',
                    confidenceScore: parsed.confidenceScore || 70
                };
            }
            throw new Error('No JSON found in response');
        } catch (error) {
            console.error('Error parsing classification:', error);
            return {
                priority: 'medium',
                priorityReasoning: 'Failed to parse AI response',
                complexity: 'medium',
                complexityReasoning: 'Failed to parse AI response',
                category: 'General',
                categoryReasoning: 'Failed to parse AI response',
                confidenceScore: 50
            };
        }
    }

    fallbackClassification(request) {
        const text = `${request.description || ''} ${request.capability || ''}`.toLowerCase();
        
        // Simple keyword-based fallback
        let priority = 'medium';
        let priorityReasoning = 'Default medium priority - no AI classification available';
        
        if (text.includes('critical') || text.includes('urgent') || text.includes('security breach')) {
            priority = 'high';
            priorityReasoning = 'Contains critical/urgent keywords';
        } else if (text.includes('enhancement') || text.includes('nice to have')) {
            priority = 'low';
            priorityReasoning = 'Contains enhancement/nice-to-have keywords';
        }
        
        let complexity = 'medium';
        let complexityReasoning = 'Default medium complexity - no AI classification available';
        
        if (text.includes('integration') && text.includes('multiple')) {
            complexity = 'high';
            complexityReasoning = 'Involves multiple system integrations';
        } else if (text.includes('configuration') || text.includes('enable')) {
            complexity = 'low';
            complexityReasoning = 'Simple configuration change';
        }
        
        let category = 'General';
        let categoryReasoning = 'Default category - no AI classification available';
        
        if (text.includes('report') || text.includes('dashboard')) {
            category = 'Reporting';
            categoryReasoning = 'Contains reporting/dashboard keywords';
        } else if (text.includes('security') || text.includes('authentication')) {
            category = 'Security';
            categoryReasoning = 'Contains security/authentication keywords';
        }
        
        return {
            priority,
            priorityReasoning,
            complexity,
            complexityReasoning,
            category,
            categoryReasoning,
            confidenceScore: 40,
            fallbackUsed: true
        };
    }
}

export default RequestClassifier;

