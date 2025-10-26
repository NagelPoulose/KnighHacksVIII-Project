import Papa from 'papaparse';

class DataProcessor {
    constructor() {
        this.acceleratorsData = [];
        this.hackData = [];
    }

    async loadCSVData() {
        try {
            // Load accelerators data
            const acceleratorsResponse = await fetch('/csv/accelerators.csv');
            const acceleratorsText = await acceleratorsResponse.text();
            const acceleratorsResult = Papa.parse(acceleratorsText, { header: true });
            this.acceleratorsData = acceleratorsResult.data.filter(row => row.name && row.description);

            // Load hack data
            const hackResponse = await fetch('/csv/u_hack.csv');
            const hackText = await hackResponse.text();
            const hackResult = Papa.parse(hackText, { header: true });
            this.hackData = hackResult.data.filter(row => Object.keys(row).length > 1);

            return {
                accelerators: this.acceleratorsData,
                hackData: this.hackData
            };
        } catch (error) {
            console.error('Error loading CSV data:', error);
            // Fallback to mock data if CSV loading fails
            return this.getMockData();
        }
    }

    getMockData() {
        // Mock data for demonstration if CSV files can't be loaded
        return {
            accelerators: [
                {
                    name: "AI Search Extension",
                    description: "Prescriptive guidance on extending your AI Search beyond the foundational level"
                },
                {
                    name: "Employee Center Pro",
                    description: "Prescriptive guidance on extending the Employee Center capabilities to include Pro features"
                }
            ],
            hackData: [
                {
                    id: "1",
                    title: "Automated Workflow Optimization",
                    description: "Customer needs automated workflow optimization for their ServiceNow instance",
                    category: "Automation",
                    priority: "High",
                    company: "TechCorp Inc",
                    status: "Open"
                },
                {
                    id: "2",
                    title: "Advanced Reporting Dashboard",
                    description: "Request for advanced reporting capabilities with custom dashboards",
                    category: "Reporting",
                    priority: "Medium",
                    company: "DataFlow Systems",
                    status: "Open"
                }
            ]
        };
    }

    processCustomerRequests(hackData) {
        return hackData.map(item => {
            const description = item.description || '';
            const capability = item.capability || '';
            const primaryCategory = item.primary_category || '';
            
            return {
                id: item.number || item.id || Math.random().toString(36).substr(2, 9),
                number: item.number,
                title: item.initiative_title || item.title || 'Untitled Request',
                short_description: item.initiative_title || item.title,
                description: description,
                category: this.categorizeRequest(capability, primaryCategory, description),
                priority: this.assessPriority(description, primaryCategory, capability),
                company: item.company || 'Unknown',
                status: item.status || 'Open',
                createdAt: item.created_at || new Date().toISOString(),
                tags: this.extractTags(description),
                sentiment: this.analyzeSentiment(description),
                complexity: this.assessComplexity(description, capability),
                capability: capability,
                primary_category: primaryCategory
            };
        });
    }

    categorizeRequest(capability, primaryCategory, description) {
        const text = `${capability} ${description}`.toLowerCase();
        
        // Check for specific categories based on capability and description
        if (text.includes('integration') || text.includes('sync') || text.includes('api') || text.includes('external')) {
            return 'Integration';
        }
        if (text.includes('automat') || text.includes('workflow') || text.includes('orchestration')) {
            return 'Automation';
        }
        if (text.includes('report') || text.includes('dashboard') || text.includes('analytic') || text.includes('visualization')) {
            return 'Reporting';
        }
        if (text.includes('security') || text.includes('access') || text.includes('authentication') || text.includes('password')) {
            return 'Security';
        }
        if (text.includes('user experience') || text.includes('portal') || text.includes('ui') || text.includes('interface')) {
            return 'User Experience';
        }
        
        return 'General';
    }

    assessPriority(description, primaryCategory, capability) {
        const text = `${description} ${capability}`.toLowerCase();
        
        // High priority indicators
        const highPriorityKeywords = [
            'critical', 'urgent', 'security', 'downtime', 'outage', 'failure', 
            'blocking', 'compliance', 'regulatory', 'breach', 'crash', 'production'
        ];
        
        // Low priority indicators
        const lowPriorityKeywords = [
            'enhancement', 'cosmetic', 'nice to have', 'future', 'consider',
            'optimize', 'improve user experience', 'minor'
        ];
        
        const highCount = highPriorityKeywords.filter(keyword => text.includes(keyword)).length;
        const lowCount = lowPriorityKeywords.filter(keyword => text.includes(keyword)).length;
        
        // Check if it's technical how-to (usually medium priority)
        const isTechnicalHowTo = primaryCategory?.toLowerCase().includes('technical how-to');
        
        // Determine priority
        if (highCount >= 2) return 'high';
        if (lowCount >= 1) return 'low';
        if (isTechnicalHowTo) return 'medium';
        
        // Default based on context
        if (text.includes('password reset') || text.includes('access')) return 'medium';
        if (text.includes('beta') || text.includes('feedback')) return 'low';
        
        return 'medium'; // Default
    }

    extractTags(description) {
        const commonTags = [
            'automation', 'integration', 'reporting', 'security', 'performance',
            'user-experience', 'data-management', 'workflow', 'analytics', 'mobile'
        ];

        return commonTags.filter(tag =>
            description.toLowerCase().includes(tag.toLowerCase())
        );
    }

    analyzeSentiment(description) {
        const positiveWords = ['improve', 'enhance', 'optimize', 'streamline', 'efficient', 'better'];
        const negativeWords = ['issue', 'problem', 'error', 'bug', 'slow', 'difficult', 'complex'];

        const positiveCount = positiveWords.filter(word =>
            description.toLowerCase().includes(word)
        ).length;

        const negativeCount = negativeWords.filter(word =>
            description.toLowerCase().includes(word)
        ).length;

        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }

    assessComplexity(description, capability) {
        const text = `${description} ${capability}`.toLowerCase();
        
        // High complexity indicators
        const highComplexityKeywords = [
            'integration', 'multi-system', 'custom development', 'architecture',
            'migration', 'scalability', 'performance optimization', 'complex workflow',
            'multiple platforms', 'api development', 'data sync', 'enterprise-wide'
        ];
        
        // Low complexity indicators  
        const lowComplexityKeywords = [
            'configuration', 'enable', 'disable', 'simple', 'basic',
            'standard', 'out-of-box', 'reset', 'view-only', 'guidance'
        ];
        
        const highCount = highComplexityKeywords.filter(keyword => text.includes(keyword)).length;
        const lowCount = lowComplexityKeywords.filter(keyword => text.includes(keyword)).length;
        
        // Check for medium complexity indicators
        const mediumKeywords = ['automation', 'workflow', 'reporting', 'dashboard', 'role-based'];
        const mediumCount = mediumKeywords.filter(keyword => text.includes(keyword)).length;
        
        // Determine complexity
        if (highCount >= 2) return 'high';
        if (lowCount >= 2) return 'low';
        if (mediumCount >= 1 || highCount === 1) return 'medium';
        
        return 'low'; // Default to low if no strong indicators
    }

    getAnalyticsData(processedData) {
        console.log('📊 Processing analytics for data:', processedData.length, 'items');

        const analytics = {
            totalRequests: processedData.length,
            byCategory: this.groupBy(processedData, 'category'),
            byPriority: this.groupBy(processedData, 'priority'),
            bySentiment: this.groupBy(processedData, 'sentiment'),
            byComplexity: this.groupBy(processedData, 'complexity'),
            topTags: this.getTopTags(processedData),
            trendData: this.getTrendData(processedData)
        };

        console.log('📈 Generated analytics:', analytics);
        console.log('🏷️ Top tags:', analytics.topTags);
        console.log('📊 Categories:', analytics.byCategory);
        console.log('😊 Sentiment:', analytics.bySentiment);

        return analytics;
    }

    groupBy(data, key) {
        return data.reduce((acc, item) => {
            const value = item[key] || 'Unknown';
            acc[value] = (acc[value] || 0) + 1;
            return acc;
        }, {});
    }

    getTopTags(data) {
        const allTags = data.flatMap(item => item.tags);
        const tagCounts = allTags.reduce((acc, tag) => {
            acc[tag] = (acc[tag] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(tagCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([tag, count]) => ({ tag, count }));
    }

    getTrendData(data) {
        const monthlyData = data.reduce((acc, item) => {
            const month = new Date(item.createdAt).toISOString().substr(0, 7);
            acc[month] = (acc[month] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(monthlyData)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, count]) => ({ month, count }));
    }

    prepareDataForAI(processedData, acceleratorsData) {
        return {
            customerRequests: processedData.slice(0, 50), // Limit for API efficiency
            existingAccelerators: acceleratorsData.slice(0, 20),
            summary: {
                totalRequests: processedData.length,
                topCategories: Object.keys(this.groupBy(processedData, 'category')).slice(0, 5),
                commonTags: this.getTopTags(processedData).slice(0, 5),
                sentimentDistribution: this.groupBy(processedData, 'sentiment')
            }
        };
    }
}

export default DataProcessor;
