import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Lightbulb,
    Target,
    TrendingUp,
    CheckCircle,
    Star,
    ArrowRight,
    Zap,
    Award,
    Clock,
    Users,
    AlertCircle,
    FileText,
    X
} from 'lucide-react';

const AcceleratorRecommendations = ({
    recommendations,
    onGenerate,
    isLoading,
    hasGapAnalysis,
    onViewRequest
}) => {
    const [selectedRecommendation, setSelectedRecommendation] = useState(null);

    const getComplexityColor = (complexity) => {
        switch (complexity?.toLowerCase()) {
            case 'high': return 'text-red-400';
            case 'medium': return 'text-yellow-400';
            case 'low': return 'text-green-400';
            default: return 'text-gray-400';
        }
    };

    const getComplexityIcon = (complexity) => {
        switch (complexity?.toLowerCase()) {
            case 'high': return '🔴';
            case 'medium': return '🟡';
            case 'low': return '🟢';
            default: return '⚪';
        }
    };

    const getPriorityColor = (index) => {
        switch (index) {
            case 0: return 'from-yellow-500 to-orange-600';
            case 1: return 'from-gray-400 to-gray-600';
            case 2: return 'from-amber-600 to-yellow-700';
            default: return 'from-blue-500 to-purple-600';
        }
    };

    const renderRecommendationDetail = (rec, index) => {
        if (selectedRecommendation !== index) return null;

        return (
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 bg-white/5 rounded-lg p-4 space-y-4"
            >
                {/* Contributing Requests */}
                {rec.contributingRequests && rec.contributingRequests.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-primary mb-2 flex items-center space-x-2">
                            <FileText className="h-4 w-4" />
                            <span>Contributing Requests ({rec.contributingRequests.length})</span>
                        </h4>
                        <div className="space-y-2">
                            {rec.contributingRequests.map((req, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-white/5 rounded p-3 cursor-pointer border border-white/10 hover:border-purple-500/50 transition-all"
                                    onClick={() => onViewRequest && onViewRequest(req)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-white">
                                                {req.title || req.short_description || `Request ${idx + 1}`}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {req.description?.substring(0, 100)}...
                                            </p>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-purple-400 ml-2 flex-shrink-0" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Identified Gaps */}
                {rec.gaps && rec.gaps.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-primary mb-2 flex items-center space-x-2">
                            <AlertCircle className="h-4 w-4" />
                            <span>Identified Gaps</span>
                        </h4>
                        <ul className="space-y-1">
                            {rec.gaps.map((gap, idx) => (
                                <li key={idx} className="text-sm text-secondary flex items-start space-x-2">
                                    <span className="text-red-400 mt-1">•</span>
                                    <span>{gap}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Suggested Solution */}
                {rec.suggestedSolution && (
                    <div>
                        <h4 className="text-sm font-semibold text-primary mb-2">Suggested Solution</h4>
                        <p className="text-sm text-secondary">{rec.suggestedSolution}</p>
                    </div>
                )}
            </motion.div>
        );
    };

    const renderRecommendations = () => {
        if (!recommendations) return null;
        
        const recs = recommendations.recommendations || recommendations || [];

        if (recs.length === 0) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                >
                    <div className="card-modern rounded-xl p-8 max-w-md mx-auto">
                        <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-primary mb-2">No Recommendations</h3>
                        <p className="text-secondary">
                            No accelerator recommendations were generated from gap analysis. All requests are currently covered.
                        </p>
                    </div>
                </motion.div>
            );
        }

        return (
            <div className="space-y-6">
                {recs.map((rec, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="card-modern rounded-xl p-6"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3 flex-1">
                                <div className={`p-2 bg-gradient-to-r ${getPriorityColor(index)} rounded-lg`}>
                                    <span className="text-white font-bold text-lg">#{index + 1}</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-primary">
                                        {rec.title || `Accelerator Recommendation ${index + 1}`}
                                    </h3>
                                    {rec.description && (
                                        <p className="text-sm text-secondary mt-1">{rec.description}</p>
                                    )}
                                    <div className="flex items-center space-x-4 mt-2">
                                        <span className="text-sm text-secondary">
                                            Priority: {index === 0 ? 'High' : index === 1 ? 'Medium' : 'Standard'}
                                        </span>
                                        {rec.complexity && (
                                            <span className={`text-sm flex items-center space-x-1 ${getComplexityColor(rec.complexity)}`}>
                                                <span>{getComplexityIcon(rec.complexity)}</span>
                                                <span>{rec.complexity} Complexity</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Star className="h-5 w-5 text-yellow-400" />
                                <span className="text-sm text-secondary">AI Recommended</span>
                            </div>
                        </div>

                        {/* Business Justification */}
                        {rec.justification && (
                            <div className="mb-4">
                                <h4 className="text-sm font-semibold text-primary flex items-center space-x-2 mb-2">
                                    <Target className="h-4 w-4" />
                                    <span>Business Justification</span>
                                </h4>
                                <p className="text-secondary text-sm leading-relaxed">
                                    {rec.justification}
                                </p>
                            </div>
                        )}

                        {/* Expected Impact */}
                        {rec.impact && (
                            <div className="mb-4">
                                <h4 className="text-sm font-semibold text-primary flex items-center space-x-2 mb-2">
                                    <Users className="h-4 w-4" />
                                    <span>Expected Customer Impact</span>
                                </h4>
                                <p className="text-primary text-sm leading-relaxed">
                                    {rec.impact}
                                </p>
                            </div>
                        )}

                        {/* Expand/Collapse Button */}
                        {((rec.contributingRequests && rec.contributingRequests.length > 0) || 
                          (rec.gaps && rec.gaps.length > 0) || 
                          rec.suggestedSolution) && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedRecommendation(
                                    selectedRecommendation === index ? null : index
                                )}
                                className="w-full mt-4 py-2 px-4 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-sm font-medium text-purple-300 transition-all flex items-center justify-center space-x-2"
                            >
                                <span>{selectedRecommendation === index ? 'Hide' : 'View'} Details</span>
                                <motion.div
                                    animate={{ rotate: selectedRecommendation === index ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ArrowRight className="h-4 w-4" />
                                </motion.div>
                            </motion.button>
                        )}

                        {/* Detail Panel */}
                        {renderRecommendationDetail(rec, index)}
                    </motion.div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <div className="flex items-center justify-center space-x-3 mb-4">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl">
                        <Lightbulb className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-primary">Accelerator Recommendations</h1>
                </div>
                <p className="text-xl text-primary">
                    AI-powered recommendations based on identified gaps
                </p>
            </motion.div>

            {/* Action Button */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex justify-center"
            >
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onGenerate}
                    disabled={isLoading || !hasGapAnalysis}
                    className={`px-8 py-4 font-semibold rounded-xl shadow-lg transition-all duration-200 flex items-center space-x-3 ${
                        hasGapAnalysis
                            ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white hover:shadow-xl'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isLoading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Generating Recommendations...</span>
                        </>
                    ) : (
                        <>
                            <Lightbulb className="h-5 w-5" />
                            <span>Generate Recommendations</span>
                            <Zap className="h-5 w-5" />
                        </>
                    )}
                </motion.button>
            </motion.div>

            {/* Status Messages */}
            {!hasGapAnalysis && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <div className="card-modern rounded-xl p-6 max-w-md mx-auto">
                        <Target className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-primary mb-2">Gap Analysis Required</h3>
                        <p className="text-secondary text-sm">
                            Please run AI analysis on requests first to identify gaps and generate accelerator recommendations.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Results */}
            {recommendations && renderRecommendations()}

            {/* No Recommendations State */}
            {!recommendations && !isLoading && hasGapAnalysis && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                >
                    <div className="card-modern rounded-xl p-8 max-w-md mx-auto">
                        <Lightbulb className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-primary mb-2">Ready to Generate</h3>
                        <p className="text-secondary">
                            Click the button above to analyze gaps and generate accelerator recommendations based on unmet customer needs.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Loading State */}
            {isLoading && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="fixed top-4 right-4 z-50"
                >
                    <div className="card-modern rounded-xl p-6 shadow-2xl border-2 border-green-500/30 bg-gradient-to-r from-green-500/10 to-teal-500/10 backdrop-blur-sm">
                        <div className="flex items-center space-x-4">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="p-3 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg"
                            >
                                <Zap className="h-6 w-6 text-white" />
                            </motion.div>
                            <div>
                                <h4 className="font-semibold text-primary">Generating Recommendations</h4>
                                <p className="text-sm text-secondary">AI is analyzing gaps...</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default AcceleratorRecommendations;
