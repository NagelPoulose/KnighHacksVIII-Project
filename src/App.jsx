import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Brain,
    Lightbulb,
    TrendingUp,
    BarChart3,
    FileText,
    AlertTriangle,
    Zap,
    ChevronRight,
    Activity
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import RequestList from './components/RequestList';
import RequestDetail from './components/RequestDetail';
import GapAnalysis from './components/GapAnalysis';
import AcceleratorRecommendations from './components/AcceleratorRecommendations';
import Analytics from './components/Analytics';
import { AcceleratorRecommendationAgent } from './services/aiAgents';
import DataProcessor from './services/dataProcessor';
import UnifiedAnalyzer from './services/unifiedAnalyzer';
import toast, { Toaster } from 'react-hot-toast';

function App() {
    const [currentView, setCurrentView] = useState('dashboard');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState(null);
    const [matchResults, setMatchResults] = useState(null);
    const [gapAnalysis, setGapAnalysis] = useState(null);
    const [recommendations, setRecommendations] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [reviewedRequests, setReviewedRequests] = useState(new Set());

    const dataProcessor = new DataProcessor();
    const unifiedAnalyzer = new UnifiedAnalyzer();
    const recommendationAgent = new AcceleratorRecommendationAgent();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const csvData = await dataProcessor.loadCSVData();
            let processedData = dataProcessor.processCustomerRequests(csvData.hackData);

            toast.success('Data loaded successfully!');
            
            // Unified AI Analysis: Classification + Matching in ONE call per request
            console.log('🤖 Starting unified AI analysis...');
            toast.loading('AI is analyzing requests...', { id: 'analysis' });
            
            const analyses = await unifiedAnalyzer.batchAnalyze(
                processedData.slice(0, 5), // First 5 requests
                csvData.accelerators,
                (progress) => {
                    toast.loading(`AI analyzing... ${progress.percentage}% (${progress.processed}/5)`, { id: 'analysis' });
                }
            );
            
            // Merge analyses back into requests
            const matchResults = [];
            processedData = processedData.map((request, index) => {
                if (index < 5 && analyses[index]) {
                    const analysis = analyses[index];
                    
                    // Store match result separately for gap analysis
                    matchResults.push({
                        requestId: request.number || request.id,
                        canBeFulfilled: analysis.canBeFulfilled,
                        matchingAccelerators: analysis.matchingAccelerators,
                        overallConfidence: analysis.overallConfidence,
                        gapAnalysis: analysis.gapAnalysis,
                        recommendation: analysis.recommendation,
                        analyzedAt: analysis.analyzedAt
                    });
                    
                    // Calculate gap priority
                    let gapPriority = 'medium';
                    let gapPriorityReasoning = '';
                    
                    if (!analysis.canBeFulfilled || analysis.overallConfidence < 30) {
                        gapPriority = 'high';
                        gapPriorityReasoning = `High gap priority - No existing accelerators can handle this (${analysis.overallConfidence}% confidence). Critical gap in catalog.`;
                    } else if (analysis.overallConfidence < 60) {
                        gapPriority = 'medium';
                        gapPriorityReasoning = `Medium gap priority - Partial coverage (${analysis.overallConfidence}% confidence). Some gaps remain.`;
                    } else {
                        gapPriority = 'low';
                        gapPriorityReasoning = `Low gap priority - Good coverage (${analysis.overallConfidence}% confidence). Can be fulfilled.`;
                    }
                    
                    return {
                        ...request,
                        // Classification fields
                        priority: analysis.priority,
                        priorityReasoning: analysis.priorityReasoning,
                        complexity: analysis.complexity,
                        complexityReasoning: analysis.complexityReasoning,
                        category: analysis.category,
                        categoryReasoning: analysis.categoryReasoning,
                        classificationConfidence: analysis.classificationConfidence,
                        // Matching fields
                        matchResult: {
                            requestId: request.number || request.id,
                            canBeFulfilled: analysis.canBeFulfilled,
                            matchingAccelerators: analysis.matchingAccelerators,
                            overallConfidence: analysis.overallConfidence,
                            gapAnalysis: analysis.gapAnalysis,
                            recommendation: analysis.recommendation,
                            analyzedAt: analysis.analyzedAt
                        },
                        // Gap priority
                        gapPriority,
                        gapPriorityReasoning
                    };
                }
                return request;
            });
            
            setMatchResults(matchResults);
            toast.success('AI analysis complete!', { id: 'analysis' });
            
            const analyticsData = dataProcessor.getAnalyticsData(processedData);

            setData({
                accelerators: csvData.accelerators,
                requests: processedData,
                analytics: analyticsData
            });
            setAnalytics(analyticsData);

            // Analyze gaps
            if (matchResults.length > 0) {
                const gaps = this.analyzeGaps(matchResults);
                setGapAnalysis(gaps);
                
                // Generate recommendations
                if (gaps.unmatched.count > 0) {
                    await generateRecommendationsFromGaps(gaps, csvData.accelerators);
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };
    
    analyzeGaps(matchResults) {
        const unmatched = matchResults.filter(r => !r.canBeFulfilled || r.overallConfidence < 50);
        const partiallyMatched = matchResults.filter(r => 
            r.canBeFulfilled && 
            r.overallConfidence >= 50 && 
            r.overallConfidence < 80
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
            averageConfidence: matchResults.length > 0 ? Math.round(
                matchResults.reduce((sum, r) => sum + r.overallConfidence, 0) / matchResults.length
            ) : 0
        };
    }


    const generateRecommendationsFromGaps = async (gaps, accelerators) => {
        try {
            console.log('💡 Generating recommendations from gaps...');
            toast.loading('Generating accelerator recommendations...', { id: 'recommendations' });

            // Prepare gap data for AI
            const gapSummary = {
                unmatchedCount: gaps.unmatched.count,
                unmatchedRequests: gaps.unmatched.requests.slice(0, 20),
                partiallyMatchedCount: gaps.partiallyMatched.count,
                categories: {}
            };

            // Group unmatched by category
            gaps.unmatched.requests.forEach(req => {
                const cat = req.category || 'General';
                gapSummary.categories[cat] = (gapSummary.categories[cat] || 0) + 1;
            });

            const recs = await recommendationAgent.recommendAccelerators(
                gapSummary,
                accelerators
            );
            setRecommendations(recs);
            console.log('✅ Recommendations generated:', recs);
            toast.success('Accelerator recommendations generated!', { id: 'recommendations' });

        } catch (error) {
            console.error('Recommendation error:', error);
            toast.error('Failed to generate recommendations', { id: 'recommendations' });
        }
    };

    const handleSelectRequest = (request) => {
        // Mark request as reviewed when viewing it
        const matchResult = matchResults?.find(m => 
            m.requestId === (request.id || request.number)
        );
        
        setSelectedRequest({
            ...request,
            matchResult,
            reviewed: reviewedRequests.has(request.id || request.number)
        });
    };

    const handleMarkReviewed = (request, markAsReviewed = true) => {
        const requestId = request.id || request.number;
        
        if (markAsReviewed) {
            setReviewedRequests(prev => new Set([...prev, requestId]));
            toast.success('Request marked as reviewed');
        } else {
            setReviewedRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(requestId);
                return newSet;
            });
            toast.success('Request unmarked as reviewed');
        }
        
        // Update the selected request
        if (selectedRequest && (selectedRequest.id || selectedRequest.number) === requestId) {
            setSelectedRequest(prev => ({ ...prev, reviewed: markAsReviewed }));
        }
    };

    const handleBackToRequests = () => {
        setSelectedRequest(null);
    };

    const navigationItems = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3, color: 'blue' },
        { id: 'requests', label: 'Customer Requests', icon: FileText, color: 'purple' },
        { id: 'gaps', label: 'Gap Analysis', icon: AlertTriangle, color: 'red' },
        { id: 'recommendations', label: 'Recommendations', icon: Lightbulb, color: 'green' },
        { id: 'analytics', label: 'Analytics', icon: TrendingUp, color: 'orange' }
    ];

    // Enrich requests with review status
    const enrichedRequests = data?.requests.map(req => ({
        ...req,
        reviewed: reviewedRequests.has(req.id || req.number)
    })) || [];

    const renderContent = () => {
        // If a request is selected, show the detail view
        if (selectedRequest) {
            return (
                <RequestDetail
                    request={selectedRequest}
                    matchResult={selectedRequest.matchResult}
                    onBack={handleBackToRequests}
                    onMarkReviewed={handleMarkReviewed}
                />
            );
        }

        switch (currentView) {
            case 'dashboard':
                return <Dashboard data={data} analytics={analytics} />;
            case 'requests':
                return (
                    <RequestList
                        requests={enrichedRequests}
                        matchResults={matchResults}
                        onSelectRequest={handleSelectRequest}
                        onMarkReviewed={handleMarkReviewed}
                    />
                );
            case 'gaps':
                return (
                    <GapAnalysis
                        gapAnalysis={gapAnalysis}
                        onViewRequest={handleSelectRequest}
                    />
                );
            case 'recommendations':
                return (
                    <AcceleratorRecommendations
                        recommendations={recommendations}
                        onGenerate={() => generateRecommendationsFromGaps(gapAnalysis, data.accelerators)}
                        isLoading={isLoading}
                        hasPatternAnalysis={!!gapAnalysis}
                    />
                );
            case 'analytics':
                return <Analytics analytics={analytics} data={data} />;
            default:
                return <Dashboard data={data} analytics={analytics} />;
        }
    };

    return (
        <div className="min-h-screen">
            <Toaster position="top-right" />

            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-effect border-b border-gray-200"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <Zap className="h-6 w-6 text-gray-700" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-primary">ServiceNow AI Hub</h1>
                                <p className="text-sm text-secondary">Accelerator Intelligence Platform</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 text-sm text-secondary">
                                <Activity className="h-4 w-4" />
                                <span>AI-Powered Analysis</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex gap-8">
                    {/* Sidebar Navigation */}
                    <motion.nav
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-64 space-y-2"
                    >
                        {navigationItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentView === item.id;

                            return (
                                <motion.button
                                    key={item.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setCurrentView(item.id)}
                                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                        ? 'bg-gray-100 text-primary shadow-sm border border-gray-200'
                                        : 'text-secondary hover:bg-gray-50 hover:text-primary'
                                        }`}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span className="font-medium">{item.label}</span>
                                    {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                                </motion.button>
                            );
                        })}
                    </motion.nav>

                    {/* Main Content */}
                    <motion.main
                        key={currentView}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex-1"
                    >
                        {renderContent()}
                    </motion.main>
                </div>
            </div>
        </div>
    );
}

export default App;
