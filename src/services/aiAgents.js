// AI Agents for ServiceNow Accelerator Analysis
const GOOGLE_API_KEY = 'AIzaSyDuCk1PkdQ2Jbdd7LAxP1xb6qDH-RHh8mQ';

class PatternAnalysisAgent {
    constructor() {
        this.name = "Pattern Analysis Agent";
        this.role = "Identify emerging customer needs and patterns from ServiceNow requests";
    }

    async analyzePatterns(customerData) {
        try {
            const prompt = `
        As a ServiceNow Pattern Analysis Agent, analyze the following customer data to identify emerging needs and patterns:
        
        Customer Data: ${JSON.stringify(customerData, null, 2)}
        
        Please provide:
        1. Top 5 emerging customer needs
        2. Pattern analysis of common pain points
        3. Trend analysis of customer requests
        4. Gap analysis in current offerings
        5. Priority recommendations for new accelerators
        
        Format your response as a structured JSON object with clear categories and insights.
      `;

            const response = await this.callGoogleAI(prompt);
            return this.parseResponse(response);
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
            console.log('Parsing AI response:', response);

            // Try to extract JSON from the response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                console.log('Successfully parsed JSON response:', parsed);
                return parsed;
            }

            // Fallback to structured text parsing
            const parsed = {
                emergingNeeds: this.extractList(response, 'emerging needs'),
                patterns: this.extractList(response, 'patterns'),
                trends: this.extractList(response, 'trends'),
                gaps: this.extractList(response, 'gaps'),
                recommendations: this.extractList(response, 'recommendations'),
                rawResponse: response
            };
            console.log('Parsed structured text response:', parsed);
            return parsed;
        } catch (error) {
            console.error('Error parsing response:', error);
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
            const prompt = `
        As a ServiceNow Accelerator Recommendation Agent, based on the pattern analysis provided, recommend new accelerators for the ServiceNow portfolio.
        
        Pattern Analysis: ${JSON.stringify(patternAnalysis, null, 2)}
        
        Existing Accelerators: ${JSON.stringify(existingAccelerators.slice(0, 10), null, 2)}
        
        Please provide:
        1. Top 5 recommended new accelerators
        2. Business justification for each recommendation
        3. Implementation complexity assessment
        4. Expected customer impact
        5. Priority ranking
        
        Format your response as a structured JSON object with detailed recommendations.
      `;

            const response = await this.callGoogleAI(prompt);
            return this.parseRecommendations(response);
        } catch (error) {
            console.error('Accelerator Recommendation Error:', error);
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
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            return {
                recommendations: this.extractRecommendations(response),
                rawResponse: response
            };
        } catch (error) {
            return {
                rawResponse: response,
                error: 'Failed to parse recommendations'
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
