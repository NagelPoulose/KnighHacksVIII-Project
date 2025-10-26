// Custom Agent System with Gemini Integration
// Implements agent-like capabilities: memory, tools, multi-step reasoning

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const MODEL_NAME = 'gemini-2.5-flash';

class AgentMemory {
    constructor(maxSize = 10) {
        this.memories = [];
        this.maxSize = maxSize;
    }

    addMemory(type, content, metadata = {}) {
        this.memories.push({
            type, // 'conversation', 'analysis', 'decision'
            content,
            metadata,
            timestamp: new Date().toISOString()
        });

        // Keep only recent memories
        if (this.memories.length > this.maxSize) {
            this.memories.shift();
        }
    }

    getRelevantMemories(query, limit = 3) {
        // Simple relevance by keyword matching
        return this.memories
            .filter(m => 
                JSON.stringify(m).toLowerCase().includes(query.toLowerCase())
            )
            .slice(-limit);
    }

    getContextSummary() {
        return this.memories.slice(-3).map(m => 
            `[${m.type}] ${m.content}`
        ).join('\n');
    }
}

class AgentTools {
    // Tool registry for agent to use
    static tools = {
        searchCustomerData: (query, data) => {
            // Search through customer data
            return data.filter(item => 
                JSON.stringify(item).toLowerCase().includes(query.toLowerCase())
            );
        },
        
        categorizePattern: (pattern, categories) => {
            // Categorize patterns into predefined categories
            return categories.find(cat => 
                pattern.toLowerCase().includes(cat.toLowerCase())
            ) || 'Other';
        },
        
        calculateTrend: (dataPoints) => {
            // Calculate trend from data points
            if (dataPoints.length < 2) return 'insufficient_data';
            
            const trend = dataPoints[dataPoints.length - 1] - dataPoints[0];
            if (trend > 0) return 'increasing';
            if (trend < 0) return 'decreasing';
            return 'stable';
        },
        
        prioritizeRecommendations: (recommendations) => {
            // Simple priority scoring
            return recommendations.map((rec, index) => ({
                ...rec,
                priority: recommendations.length - index,
                score: (recommendations.length - index) * 10
            })).sort((a, b) => b.score - a.score);
        }
    };

    static async executeTool(toolName, args) {
        if (!this.tools[toolName]) {
            throw new Error(`Tool ${toolName} not found`);
        }
        return this.tools[toolName](...args);
    }

    static getToolDescriptions() {
        return Object.keys(this.tools).map(toolName => ({
            name: toolName,
            description: `Execute ${toolName} with provided arguments`,
            parameters: 'varies by tool'
        }));
    }
}

class Agent {
    constructor(name, role, systemPrompt) {
        this.name = name;
        this.role = role;
        this.systemPrompt = systemPrompt;
        this.memory = new AgentMemory();
        this.conversationHistory = [];
    }

    async think(prompt, context = {}) {
        // Multi-step agent reasoning
        
        // 1. Gather context from memory
        const memoryContext = this.memory.getContextSummary();
        
        // 2. Formulate enhanced prompt with agent capabilities
        const agentPrompt = `
You are ${this.name}, a ${this.role}.

System Context: ${this.systemPrompt}

Previous Context:
${memoryContext}

Available Tools:
${JSON.stringify(AgentTools.getToolDescriptions(), null, 2)}

Current Task:
${prompt}

Context Data:
${JSON.stringify(context, null, 2)}

Instructions:
1. Think step by step about this problem
2. Consider relevant information from context
3. Identify what tools might be useful
4. Provide your analysis with reasoning

Format your response as JSON with:
{
    "reasoning": "step-by-step reasoning",
    "tools_needed": ["tool1", "tool2"],
    "analysis": "your detailed analysis",
    "confidence": 0.0-1.0,
    "next_steps": ["step1", "step2"]
}
`;

        try {
            const response = await this.callGoogleAI(agentPrompt);
            const parsed = this.parseResponse(response);
            
            // Store reasoning in memory
            this.memory.addMemory('analysis', parsed.analysis, {
                reasoning: parsed.reasoning,
                tools: parsed.tools_needed,
                confidence: parsed.confidence
            });

            // Execute tools if needed
            if (parsed.tools_needed && parsed.tools_needed.length > 0) {
                parsed.tool_results = await this.executeTools(
                    parsed.tools_needed,
                    context
                );
            }

            return parsed;
        } catch (error) {
            console.error(`Agent ${this.name} error:`, error);
            throw error;
        }
    }

    async executeTools(toolNames, context) {
        const results = {};
        
        for (const toolName of toolNames) {
            try {
                // Map context data to tool arguments based on tool name
                let args = [];
                
                if (toolName === 'searchCustomerData') {
                    args = ['', context.data || []];
                } else if (toolName === 'prioritizeRecommendations') {
                    args = [context.recommendations || []];
                } else if (toolName === 'calculateTrend') {
                    args = [context.dataPoints || []];
                }
                
                results[toolName] = await AgentTools.executeTool(toolName, args);
            } catch (error) {
                console.error(`Error executing tool ${toolName}:`, error);
                results[toolName] = { error: error.message };
            }
        }
        
        return results;
    }

    async callGoogleAI(prompt) {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GOOGLE_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Google AI API error: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    parseResponse(response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            // Fallback structure
            return {
                reasoning: response,
                tools_needed: [],
                analysis: response,
                confidence: 0.5,
                next_steps: []
            };
        } catch (error) {
            console.error('Error parsing agent response:', error);
            return {
                reasoning: response,
                analysis: response,
                error: error.message
            };
        }
    }

    addConversation(role, message) {
        this.conversationHistory.push({ role, message, timestamp: new Date() });
        this.memory.addMemory('conversation', message, { role });
    }

    getConversationSummary() {
        return this.conversationHistory
            .slice(-5)
            .map(c => `${c.role}: ${c.message}`)
            .join('\n');
    }
}

// Specialized Agent Classes
class PatternAnalysisAgent extends Agent {
    constructor() {
        super(
            'Pattern Analysis Agent',
            'Data Pattern Analyst',
            'You are an expert at identifying patterns, trends, and emerging needs in customer data. Use multi-step reasoning and available tools to provide deep insights.'
        );
    }

    async analyzePatterns(customerData) {
        const context = {
            data: customerData,
            timestamp: new Date().toISOString()
        };

        const prompt = `
Analyze the following customer data to identify:
1. Emerging customer needs
2. Common patterns and pain points
3. Trends in customer requests
4. Gaps in current offerings
5. Priority recommendations for new accelerators

Customer Data: ${JSON.stringify(customerData, null, 2)}

Provide structured analysis with reasoning.
`;

        const result = await this.think(prompt, context);
        
        // Transform result into expected format
        return {
            emergingNeeds: result.analysis.match(/emerging.*?needs?/i) 
                ? this.extractArray(result.analysis) 
                : [],
            patterns: this.extractArray(result.analysis),
            trends: result.next_steps || [],
            gaps: [],
            recommendations: [],
            reasoning: result.reasoning,
            confidence: result.confidence,
            rawResponse: result
        };
    }

    extractArray(text, count = 5) {
        // Extract array-like items from text
        const items = text.match(/\d+\.\s*([^\n]+)/g) || [];
        return items.slice(0, count).map(item => item.replace(/^\d+\.\s*/, ''));
    }
}

class AcceleratorRecommendationAgent extends Agent {
    constructor() {
        super(
            'Accelerator Recommendation Agent',
            'Strategic Accelerator Advisor',
            'You are an expert at recommending accelerators based on data analysis. Use your tools and reasoning to provide strategic recommendations.'
        );
    }

    async recommendAccelerators(patternAnalysis, existingAccelerators) {
        const context = {
            patternAnalysis,
            existingAccelerators,
            timestamp: new Date().toISOString()
        };

        const prompt = `
Based on this pattern analysis, recommend new accelerators:
${JSON.stringify(patternAnalysis, null, 2)}

Provide:
1. Top 5 accelerator recommendations
2. Business justification for each
3. Implementation complexity
4. Expected customer impact
`;

        const result = await this.think(prompt, context);
        
        // Execute prioritization tool
        const prioritized = await AgentTools.executeTool(
            'prioritizeRecommendations',
            [result.next_steps || []]
        );

        return {
            recommendations: prioritized || [],
            reasoning: result.reasoning,
            confidence: result.confidence,
            rawResponse: result
        };
    }
}

export { Agent, PatternAnalysisAgent, AcceleratorRecommendationAgent, AgentMemory, AgentTools };
