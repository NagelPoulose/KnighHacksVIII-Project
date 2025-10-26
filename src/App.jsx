import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Brain,
    Lightbulb,
    TrendingUp,
    BarChart3,
    Users,
    Target,
    Zap,
    ChevronRight,
    Sparkles,
    Activity
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import PatternAnalysis from './components/PatternAnalysis';
import AcceleratorRecommendations from './components/AcceleratorRecommendations';
import Analytics from './components/Analytics';
import { PatternAnalysisAgent, AcceleratorRecommendationAgent } from './services/aiAgents';
import DataProcessor from './services/dataProcessor';
import toast, { Toaster } from 'react-hot-toast';

function App() {
    const [currentView, setCurrentView] = useState('dashboard');
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState(null);
    const [patternAnalysis, setPatternAnalysis] = useState(null);
    const [recommendations, setRecommendations] = useState(null);
    const [analytics, setAnalytics] = useState(null);

    const dataProcessor = new DataProcessor();
    const patternAgent = new PatternAnalysisAgent();
    const recommendationAgent = new AcceleratorRecommendationAgent();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const csvData = await dataProcessor.loadCSVData();
            const processedData = dataProcessor.processCustomerRequests(csvData.hackData);
            const analyticsData = dataProcessor.getAnalyticsData(processedData);

            setData({
                accelerators: csvData.accelerators,
                requests: processedData,
                analytics: analyticsData
            });
            setAnalytics(analyticsData);

            toast.success('Data loaded successfully!');
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const runPatternAnalysis = async () => {
        if (!data) {
            toast.error('No data available. Please wait for data to load.');
            return;
        }

        setIsLoading(true);
        try {
            console.log('Starting pattern analysis with data:', data);
            const aiData = dataProcessor.prepareDataForAI(data.requests, data.accelerators);
            console.log('Prepared AI data:', aiData);

            const analysis = await patternAgent.analyzePatterns(aiData);
            console.log('Pattern analysis result:', analysis);

            setPatternAnalysis(analysis);
            toast.success('Pattern analysis completed!');
        } catch (error) {
            console.error('Pattern analysis error:', error);
            toast.error('Failed to run pattern analysis: ' + error.message);
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

    const navigationItems = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3, color: 'blue' },
        { id: 'patterns', label: 'Pattern Analysis', icon: Brain, color: 'purple' },
        { id: 'recommendations', label: 'Recommendations', icon: Lightbulb, color: 'green' },
        { id: 'analytics', label: 'Analytics', icon: TrendingUp, color: 'orange' }
    ];

    const renderContent = () => {
        switch (currentView) {
            case 'dashboard':
                return <Dashboard data={data} analytics={analytics} />;
            case 'patterns':
                return (
                    <PatternAnalysis
                        analysis={patternAnalysis}
                        onRunAnalysis={runPatternAnalysis}
                        isLoading={isLoading}
                        data={data}
                    />
                );
            case 'recommendations':
                return (
                    <AcceleratorRecommendations
                        recommendations={recommendations}
                        onGenerate={generateRecommendations}
                        isLoading={isLoading}
                        hasPatternAnalysis={!!patternAnalysis}
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
                                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                                        isActive
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
