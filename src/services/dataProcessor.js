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
        return hackData.map(item => ({
            id: item.id || Math.random().toString(36).substr(2, 9),
            title: item.title || 'Untitled Request',
            description: item.description || '',
            category: item.category || 'General',
            priority: item.priority || 'Medium',
            company: item.company || 'Unknown',
            status: item.status || 'Open',
            createdAt: item.created_at || new Date().toISOString(),
            tags: this.extractTags(item.description || ''),
            sentiment: this.analyzeSentiment(item.description || ''),
            complexity: this.assessComplexity(item.description || '')
        }));
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

    assessComplexity(description) {
        const complexityIndicators = [
            'integration', 'automation', 'workflow', 'api', 'database',
            'security', 'performance', 'scalability', 'multi-system'
        ];

        const indicatorCount = complexityIndicators.filter(indicator =>
            description.toLowerCase().includes(indicator)
        ).length;

        if (indicatorCount >= 4) return 'high';
        if (indicatorCount >= 2) return 'medium';
        return 'low';
    }

    getAnalyticsData(processedData) {
        const analytics = {
            totalRequests: processedData.length,
            byCategory: this.groupBy(processedData, 'category'),
            byPriority: this.groupBy(processedData, 'priority'),
            bySentiment: this.groupBy(processedData, 'sentiment'),
            byComplexity: this.groupBy(processedData, 'complexity'),
            topTags: this.getTopTags(processedData),
            trendData: this.getTrendData(processedData)
        };

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
