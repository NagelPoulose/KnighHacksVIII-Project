// AI Agents for ServiceNow Accelerator Analysis
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

class PatternAnalysisAgent {
    constructor() {
        this.name = "Pattern Analysis Agent";
        this.role = "Identify emerging customer needs and patterns from ServiceNow requests";
    }

    async analyzePatterns(customerData) {
        try {
            const startTime = Date.now();
            
            // Enhanced prompt with confidence scoring requirements
            const prompt = `
        As a ServiceNow Pattern Analysis Agent, analyze the following customer data to identify emerging needs and patterns:
        
        Customer Data: ${JSON.stringify(customerData, null, 2)}
        
        Please provide:
        1. Top 5 emerging customer needs
        2. Pattern analysis of common pain points
        3. Trend analysis of customer requests
        4. Gap analysis in current offerings
        5. Priority recommendations for new accelerators
        
        Format your response as a JSON object with these exact keys:
        {
            "emergingNeeds": ["need1", "need2", "need3", "need4", "need5"],
            "patterns": ["pattern1", "pattern2", "pattern3", "pattern4", "pattern5"],
            "trends": ["trend1", "trend2", "trend3", "trend4", "trend5"],
            "gaps": ["gap1", "gap2", "gap3", "gap4", "gap5"],
            "recommendations": ["rec1", "rec2", "rec3", "rec4", "rec5"]
        }
      `;

            console.log('🔍 Pattern Analysis Agent - Starting analysis...');
            console.log('📊 Customer Data:', customerData);
            const response = await this.callGoogleAI(prompt);
            console.log('🤖 Pattern Analysis Agent - Raw response:', response);

            const parsed = this.parseResponse(response);
            console.log('✅ Pattern Analysis Agent - Parsed response:', parsed);
            console.log('📋 Emerging Needs:', parsed.emergingNeeds);
            console.log('🔍 Patterns:', parsed.patterns);
            console.log('📊 Confidence Score:', parsed.overallConfidence);

            return parsed;
        } catch (error) {
            console.error('Pattern Analysis Error:', error);
            // Return mock analysis if API fails
            return {
                emergingNeeds: [
                    "Automated workflow optimization",
                    "Advanced reporting and analytics",
                    "Enhanced security and compliance",
                    "Mobile-first user experience",
                    "Integration with third-party systems"
                ],
                patterns: [
                    "High demand for automation capabilities",
                    "Need for better data visualization",
                    "Security concerns across all requests",
                    "User experience improvements needed",
                    "Integration complexity challenges"
                ],
                trends: [
                    "Increasing focus on AI and automation",
                    "Growing need for mobile solutions",
                    "Security becoming top priority",
                    "Demand for real-time analytics",
                    "Integration challenges increasing"
                ],
                gaps: [
                    "Limited mobile accelerator options",
                    "Insufficient AI-powered solutions",
                    "Lack of security-focused accelerators",
                    "Missing integration accelerators",
                    "Limited user experience guidance"
                ],
                recommendations: [
                    "Develop mobile-first accelerator",
                    "Create AI automation accelerator",
                    "Build security compliance accelerator",
                    "Design integration accelerator",
                    "Create UX optimization accelerator"
                ],
                rawResponse: "Mock analysis due to API error: " + error.message
            };
        }
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
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`Google AI API error: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    parseResponse(response) {
        try {
            console.log('🔍 Parsing AI response:', response);

            // Try to extract JSON from the response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonStr = jsonMatch[0];
                console.log('📄 Extracted JSON string:', jsonStr);
                const parsed = JSON.parse(jsonStr);
                console.log('✅ Successfully parsed JSON response:', parsed);
                return parsed;
            }

            // Fallback to structured text parsing
            console.log('⚠️ No JSON found, using text parsing fallback');
            const parsed = {
                emergingNeeds: this.extractList(response, 'emerging needs'),
                patterns: this.extractList(response, 'patterns'),
                trends: this.extractList(response, 'trends'),
                gaps: this.extractList(response, 'gaps'),
                recommendations: this.extractList(response, 'recommendations'),
                rawResponse: response
            };
            console.log('📝 Parsed structured text response:', parsed);
            return parsed;
        } catch (error) {
            console.error('❌ Error parsing response:', error);
            return {
                rawResponse: response,
                error: 'Failed to parse structured response: ' + error.message
            };
        }
    }

    extractList(text, keyword) {
        const lines = text.split('\n');
        const relevantLines = lines.filter(line =>
            line.toLowerCase().includes(keyword.toLowerCase())
        );
        return relevantLines.slice(0, 5);
    }
}

class AcceleratorRecommendationAgent {
    constructor() {
        this.name = "Accelerator Recommendation Agent";
        this.role = "Recommend new accelerators based on pattern analysis";
    }

    async recommendAccelerators(patternAnalysis, existingAccelerators) {
        try {
            console.log('💡 Accelerator Recommendation Agent - Starting recommendations...');
            console.log('📊 Pattern Analysis Input:', patternAnalysis);
            console.log('🏢 Existing Accelerators:', existingAccelerators.slice(0, 5));

            const prompt = `
        As a ServiceNow Accelerator Recommendation Agent, analyze customer requests that CANNOT be fulfilled by existing accelerators and recommend NEW accelerators to fill those gaps.
        
        GAP DATA:
        - Unmatched Requests: ${patternAnalysis.unmatchedCount || 0} (requests with no matching accelerators)
        - Unmatched Request Details: ${JSON.stringify(patternAnalysis.unmatchedRequests?.slice(0, 10) || [], null, 2)}
        - Partially Matched Requests: ${patternAnalysis.partiallyMatchedCount || 0} (requests with poor match quality)
        - Partially Matched Request Details: ${JSON.stringify(patternAnalysis.partiallyMatchedRequests?.slice(0, 5) || [], null, 2)}
        
        Existing Accelerators: ${JSON.stringify(existingAccelerators.slice(0, 10).map(a => a.name), null, 2)}
        
        YOUR TASK:
        1. Analyze the unmatched/partially matched requests to identify SIMILAR unmet needs (they don't have to be identical)
        2. Group similar requests together by SIMILAR gap theme (e.g., "mobile functionality", "advanced reporting", "third-party integrations", "automation", "security")
        3. For each SIMILAR gap theme, recommend ONE new accelerator that would address those similar gaps
        4. List ALL specific requests that have SIMILAR gaps (not just 1 request per recommendation!)
        5. Let the AI use its discretion to determine what gaps are "similar enough" to group together
        
        CRITICAL: For each recommendation, you MUST:
        - Group MULTIPLE requests with SIMILAR (not necessarily identical) gaps together
        - contributingRequests: Include ALL request IDs/numbers that have similar gaps (typically 3-15 requests per recommendation)
        - gaps: List the SIMILAR gaps that these requests share (let AI determine similarity)
        - suggestedSolution: How this single accelerator addresses the SIMILAR gaps for ALL contributing requests
        
        Format your response as a JSON object:
        {
            "recommendations": [
                {
                    "title": "Accelerator Name",
                    "description": "Brief description",
                    "justification": "Business justification",
                    "complexity": "Low/Medium/High",
                    "impact": "Expected customer impact",
                    "contributingRequests": [
                        {
                            "id": "request_id",
                            "title": "Request title",
                            "description": "Brief description"
                        }
                    ],
                    "gaps": ["Specific gap 1", "Specific gap 2"],
                    "suggestedSolution": "How this accelerator addresses the gaps"
                }
            ]
        }
      `;

            console.log('🤖 Sending recommendation request to AI...');
            const response = await this.callGoogleAI(prompt);
            console.log('📄 Raw recommendation response:', response);

            const parsed = this.parseRecommendations(response);
            console.log('✅ Parsed recommendations:', parsed);

            return parsed;
        } catch (error) {
            console.error('❌ Accelerator Recommendation Error:', error);
            // Return mock recommendations if API fails
            return {
                recommendations: [
                    {
                        title: "AI-Powered Workflow Automation Accelerator",
                        justification: "Addresses the high demand for automation capabilities identified in customer patterns. Provides prescriptive guidance for implementing AI-driven workflow optimization.",
                        complexity: "Medium",
                        impact: "High customer satisfaction and operational efficiency gains"
                    },
                    {
                        title: "Mobile-First ServiceNow Experience Accelerator",
                        justification: "Responds to growing mobile needs and user experience requirements. Offers comprehensive mobile optimization strategies.",
                        complexity: "High",
                        impact: "Significant user adoption and engagement improvements"
                    },
                    {
                        title: "Advanced Security & Compliance Accelerator",
                        justification: "Addresses security concerns and compliance requirements across all customer segments. Provides framework for robust security implementation.",
                        complexity: "Medium",
                        impact: "Enhanced security posture and regulatory compliance"
                    },
                    {
                        title: "Real-Time Analytics & Reporting Accelerator",
                        justification: "Meets the growing demand for real-time analytics and better data visualization capabilities identified in customer patterns.",
                        complexity: "Medium",
                        impact: "Improved decision-making and operational visibility"
                    },
                    {
                        title: "Third-Party Integration Accelerator",
                        justification: "Addresses integration complexity challenges and growing need for seamless third-party system connectivity.",
                        complexity: "High",
                        impact: "Reduced integration complexity and improved system connectivity"
                    }
                ],
                rawResponse: "Mock recommendations due to API error: " + error.message
            };
        }
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
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`Google AI API error: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    parseRecommendations(response) {
        try {
            console.log('🔍 Parsing recommendation response:', response);

            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonStr = jsonMatch[0];
                console.log('📄 Extracted JSON string:', jsonStr);
                const parsed = JSON.parse(jsonStr);
                console.log('✅ Successfully parsed JSON recommendations:', parsed);
                return parsed;
            }

            console.log('⚠️ No JSON found, using text parsing fallback');
            const parsed = {
                recommendations: this.extractRecommendations(response),
                rawResponse: response
            };
            console.log('📝 Parsed text recommendations:', parsed);
            return parsed;
        } catch (error) {
            console.error('❌ Error parsing recommendations:', error);
            return {
                rawResponse: response,
                error: 'Failed to parse recommendations: ' + error.message
            };
        }
    }

    extractRecommendations(text) {
        const lines = text.split('\n');
        const recommendations = [];
        let currentRec = {};

        lines.forEach(line => {
            if (line.match(/^\d+\./)) {
                if (currentRec.title) recommendations.push(currentRec);
                currentRec = { title: line.trim() };
            } else if (line.includes('Justification:') || line.includes('Business Value:')) {
                currentRec.justification = line.replace(/.*(Justification|Business Value):\s*/, '');
            } else if (line.includes('Complexity:') || line.includes('Implementation:')) {
                currentRec.complexity = line.replace(/.*(Complexity|Implementation):\s*/, '');
            } else if (line.includes('Impact:') || line.includes('Customer Impact:')) {
                currentRec.impact = line.replace(/.*(Impact|Customer Impact):\s*/, '');
            }
        });

        if (currentRec.title) recommendations.push(currentRec);
        return recommendations.slice(0, 5);
    }
}

export { PatternAnalysisAgent, AcceleratorRecommendationAgent };
