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
    const [reviewedRequests, setReviewedRequests] = useState(() => {
        // Load reviewed requests from localStorage
        const stored = localStorage.getItem('reviewedRequests');
        return stored ? new Set(JSON.parse(stored)) : new Set();
    });
    const [numRequestsToAnalyze, setNumRequestsToAnalyze] = useState(() => {
        // Load from localStorage or default to 30
        const stored = localStorage.getItem('numRequestsToAnalyze');
        return stored ? parseInt(stored) : 30;
    });

    const dataProcessor = new DataProcessor();
    const unifiedAnalyzer = new UnifiedAnalyzer();
    const recommendationAgent = new AcceleratorRecommendationAgent();

    useEffect(() => {
        loadData();
    }, []);

    // Save numRequestsToAnalyze to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('numRequestsToAnalyze', numRequestsToAnalyze.toString());
    }, [numRequestsToAnalyze]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const csvData = await dataProcessor.loadCSVData();
            let processedData = dataProcessor.processCustomerRequests(csvData.hackData);

            // Check if we have cached AI analyses (from any requests, not just first 5)
            const cachedAnalyses = [];
            processedData.forEach(request => {
                const cached = unifiedAnalyzer.analysisCache.get(request.number || request.id);
                if (cached) {
                    cachedAnalyses.push(cached);
                }
            });

            // Apply cached analyses if we have them
            if (cachedAnalyses.length > 0) {
                console.log(`✅ Loaded ${cachedAnalyses.length} cached analyses`);
                processedData = applyAnalysesToRequests(processedData, cachedAnalyses);
                
                const matchResultsFromCache = cachedAnalyses.map(a => ({
                    requestId: a.requestId,
                    canBeFulfilled: a.canBeFulfilled,
                    matchingAccelerators: a.matchingAccelerators,
                    overallConfidence: a.overallConfidence,
                    gapAnalysis: a.gapAnalysis,
                    recommendation: a.recommendation,
                    analyzedAt: a.analyzedAt
                }));
                
                setMatchResults(matchResultsFromCache);
                
                const gaps = analyzeGaps(matchResultsFromCache);
                setGapAnalysis(gaps);
                
                toast.success(`Loaded ${cachedAnalyses.length} cached AI analyses!`);
            }

            const analyticsData = dataProcessor.getAnalyticsData(processedData);

            setData({
                accelerators: csvData.accelerators,
                requests: processedData,
                analytics: analyticsData
            });
            setAnalytics(analyticsData);

            // Load cached recommendations on startup
            const cachedRecs = localStorage.getItem('recommendations');
            if (cachedRecs) {
                console.log('📦 Loading cached recommendations on startup');
                setRecommendations(JSON.parse(cachedRecs));
            }

            toast.success('Data loaded successfully!');
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const generateRecommendations = async () => {
        if (!patternAnalysis) {
            toast.error('Please run pattern analysis first');
            return;
        }

        setIsLoading(true);
        try {
            const recs = await recommendationAgent.recommendAccelerators(
                patternAnalysis,
                data.accelerators
            );
            setRecommendations(recs);
            toast.success('Accelerator recommendations generated!');
        } catch (error) {
            console.error('Recommendation error:', error);
            toast.error('Failed to generate recommendations');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectRequest = (request) => {
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
            setReviewedRequests(prev => {
                const newSet = new Set([...prev, requestId]);
                // Save to localStorage
                localStorage.setItem('reviewedRequests', JSON.stringify([...newSet]));
                return newSet;
            });
            toast.success('Request marked as reviewed');
        } else {
            setReviewedRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(requestId);
                // Save to localStorage
                localStorage.setItem('reviewedRequests', JSON.stringify([...newSet]));
                return newSet;
            });
            toast.success('Request unmarked as reviewed');
        }
        
        if (selectedRequest && (selectedRequest.id || selectedRequest.number) === requestId) {
            setSelectedRequest(prev => ({ ...prev, reviewed: markAsReviewed }));
        }
    };

    const handleBackToRequests = () => {
        setSelectedRequest(null);
    };

    const runAIAnalysis = async () => {
        if (!data) {
            toast.error('Please wait for data to load first');
            return;
        }

        // Clear recommendations cache when running new analysis
        localStorage.removeItem('recommendations');
        setRecommendations(null);

        setIsLoading(true);
        try {
            console.log('🤖 Starting unified AI analysis...');
            toast.loading('AI is analyzing requests...', { id: 'analysis' });
            
            // Pick N random requests from ALL requests based on user setting
            const numToAnalyze = Math.min(numRequestsToAnalyze, data.requests.length);
            const shuffled = [...data.requests].sort(() => Math.random() - 0.5);
            const randomRequests = shuffled.slice(0, numToAnalyze);
            
            console.log(`🎲 Selected ${numToAnalyze} random requests:`, randomRequests.map(r => r.number || r.id));
            
            const analyses = await unifiedAnalyzer.batchAnalyze(
                randomRequests,
                data.accelerators,
                (progress) => {
                    toast.loading(`AI analyzing... ${progress.percentage}% (${progress.processed}/${numToAnalyze})`, { id: 'analysis' });
                }
            );
            
            console.log('✅ Analyses received:', analyses);
            console.log('✅ First analysis sample:', JSON.stringify(analyses[0], null, 2));
            
            const updatedRequests = applyAnalysesToRequests(data.requests, analyses);
            
            const matchResultsArray = analyses.map(a => ({
                requestId: a.requestId,
                canBeFulfilled: a.canBeFulfilled,
                matchingAccelerators: a.matchingAccelerators,
                overallConfidence: a.overallConfidence,
                gapAnalysis: a.gapAnalysis,
                recommendation: a.recommendation,
                analyzedAt: a.analyzedAt
            }));
            
            console.log('✅ Match results array:', matchResultsArray);
            
            setMatchResults(matchResultsArray);
            setData(prev => ({ ...prev, requests: updatedRequests }));
            toast.success('AI analysis complete!', { id: 'analysis' });
            
            const gaps = analyzeGaps(matchResultsArray);
            setGapAnalysis(gaps);
        } catch (error) {
            console.error('❌ AI analysis error:', error);
            toast.error('AI analysis failed: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const applyAnalysesToRequests = (requests, analyses) => {
        // Create a map of analyses by requestId for fast lookup
        const analysesMap = new Map();
        analyses.forEach(analysis => {
            analysesMap.set(analysis.requestId, analysis);
        });
        
        return requests.map((request) => {
            const requestId = request.number || request.id;
            const analysis = analysesMap.get(requestId);
            
            if (analysis) {
                return {
                    ...request,
                    priority: analysis.priority,
                    priorityReasoning: analysis.priorityReasoning,
                    complexity: analysis.complexity,
                    complexityReasoning: analysis.complexityReasoning,
                    category: analysis.category,
                    categoryReasoning: analysis.categoryReasoning,
                    classificationConfidence: analysis.classificationConfidence,
                    matchResult: {
                        requestId: requestId,
                        canBeFulfilled: analysis.canBeFulfilled,
                        matchingAccelerators: analysis.matchingAccelerators,
                        overallConfidence: analysis.overallConfidence,
                        gapAnalysis: analysis.gapAnalysis,
                        recommendation: analysis.recommendation,
                        analyzedAt: analysis.analyzedAt
                    }
                };
            }
            return request;
        });
    };

    const generateRecommendationsFromGaps = async (gaps, accelerators) => {
        if (!gaps || !accelerators) return;
        
        // Set loading state immediately
        setIsLoading(true);
        toast.loading('Generating accelerator recommendations...', { id: 'recommendations' });
        
        try {

            // Get full request data for unmatched/partially matched requests
            const unmatchedRequestsData = gaps.unmatched?.requests?.map(req => {
                const fullRequest = data.requests.find(r => 
                    (r.id || r.number) === (req.requestId || req.id || req.number)
                );
                return fullRequest || req;
            }) || [];

            const partiallyMatchedRequestsData = gaps.partiallyMatched?.requests?.map(req => {
                const fullRequest = data.requests.find(r => 
                    (r.id || r.number) === (req.requestId || req.id || req.number)
                );
                return fullRequest || req;
            }) || [];

            const gapSummary = {
                unmatchedCount: gaps.unmatched?.count || 0,
                unmatchedRequests: unmatchedRequestsData, // Send ALL unmatched requests
                partiallyMatchedCount: gaps.partiallyMatched?.count || 0,
                partiallyMatchedRequests: partiallyMatchedRequestsData, // Send ALL partially matched requests
            };

            const recs = await recommendationAgent.recommendAccelerators(gapSummary, accelerators);
            
            console.log('📄 Full recommendations response:', JSON.stringify(recs, null, 2));
            
            // Cache the recommendations
            localStorage.setItem('recommendations', JSON.stringify(recs));
            console.log('✅ Cached recommendations with full details');
            
            setRecommendations(recs);
            toast.success('Recommendations generated successfully!', { id: 'recommendations' });
        } catch (error) {
            console.error('Recommendation error:', error);
            toast.error('Failed to generate recommendations', { id: 'recommendations' });
        } finally {
            setIsLoading(false);
        }
    };

    const analyzeGaps = (matchResults) => {
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
                percentage: matchResults.length > 0 ? Math.round((unmatched.length / matchResults.length) * 100) : 0,
                requests: unmatched
            },
            partiallyMatched: {
                count: partiallyMatched.length,
                percentage: matchResults.length > 0 ? Math.round((partiallyMatched.length / matchResults.length) * 100) : 0,
                requests: partiallyMatched
            },
            fullyMatched: {
                count: fullyMatched.length,
                percentage: matchResults.length > 0 ? Math.round((fullyMatched.length / matchResults.length) * 100) : 0,
                requests: fullyMatched
            },
            averageConfidence: matchResults.length > 0 ? Math.round(
                matchResults.reduce((sum, r) => sum + r.overallConfidence, 0) / matchResults.length
            ) : 0
        };
    };

    const navigationItems = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3, color: 'blue' },
        { id: 'requests', label: 'Customer Requests', icon: FileText, color: 'purple' },
        { id: 'gaps', label: 'Gap Analysis', icon: AlertTriangle, color: 'red' },
        { id: 'recommendations', label: 'Recommendations', icon: Lightbulb, color: 'green' }
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
                return (
                    <Dashboard 
                        data={data} 
                        analytics={analytics}
                        onRunAIAnalysis={runAIAnalysis}
                        hasAIAnalysis={matchResults && matchResults.length > 0}
                        isLoading={isLoading}
                        numRequestsToAnalyze={numRequestsToAnalyze}
                        setNumRequestsToAnalyze={setNumRequestsToAnalyze}
                    />
                );
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
                        hasGapAnalysis={!!gapAnalysis}
                        onViewRequest={handleSelectRequest}
                    />
                );
            default:
                return (
                    <Dashboard 
                        data={data} 
                        analytics={analytics}
                        onRunAIAnalysis={runAIAnalysis}
                        hasAIAnalysis={matchResults && matchResults.length > 0}
                        isLoading={isLoading}
                        numRequestsToAnalyze={numRequestsToAnalyze}
                        setNumRequestsToAnalyze={setNumRequestsToAnalyze}
                    />
                );
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
