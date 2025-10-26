import React from 'react';
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
    Users
} from 'lucide-react';

const AcceleratorRecommendations = ({
    recommendations,
    onGenerate,
    isLoading,
    hasPatternAnalysis
}) => {
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

    const renderRecommendations = () => {
        if (!recommendations) return null;

        const recs = recommendations.recommendations || [];

        if (recs.length === 0) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                >
                    <div className="glass-effect rounded-xl p-8 max-w-md mx-auto">
                        <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No Recommendations</h3>
                        <p className="text-gray-400">
                            No accelerator recommendations were generated. Try running pattern analysis first.
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
                        className="glass-effect rounded-xl p-6 card-hover"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 bg-gradient-to-r ${getPriorityColor(index)} rounded-lg`}>
                                    <span className="text-white font-bold text-lg">#{index + 1}</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white">
                                        {rec.title || `Accelerator Recommendation ${index + 1}`}
                                    </h3>
                                    <div className="flex items-center space-x-4 mt-1">
                                        <span className="text-sm text-gray-400">
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
                                <span className="text-sm text-gray-400">AI Recommended</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Business Justification */}
                            {rec.justification && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-gray-300 flex items-center space-x-2">
                                        <Target className="h-4 w-4" />
                                        <span>Business Justification</span>
                                    </h4>
                                    <p className="text-gray-300 text-sm leading-relaxed">
                                        {rec.justification}
                                    </p>
                                </div>
                            )}

                            {/* Implementation Complexity */}
                            {rec.complexity && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-gray-300 flex items-center space-x-2">
                                        <Clock className="h-4 w-4" />
                                        <span>Implementation Complexity</span>
                                    </h4>
                                    <p className="text-gray-300 text-sm leading-relaxed">
                                        {rec.complexity}
                                    </p>
                                </div>
                            )}

                            {/* Customer Impact */}
                            {rec.impact && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-gray-300 flex items-center space-x-2">
                                        <Users className="h-4 w-4" />
                                        <span>Expected Customer Impact</span>
                                    </h4>
                                    <p className="text-gray-300 text-sm leading-relaxed">
                                        {rec.impact}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                            <div className="flex items-center space-x-4">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Approve</span>
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-4 py-2 bg-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-all duration-200 flex items-center space-x-2"
                                >
                                    <TrendingUp className="h-4 w-4" />
                                    <span>Analyze Further</span>
                                </motion.button>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-400">
                                <Award className="h-4 w-4" />
                                <span>AI Generated</span>
                            </div>
                        </div>
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
                    <h1 className="text-4xl font-bold text-white">Accelerator Recommendations</h1>
                </div>
                <p className="text-xl text-gray-300">
                    AI-powered recommendations for new ServiceNow accelerators
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
                    disabled={isLoading || !hasPatternAnalysis}
                    className={`px-8 py-4 font-semibold rounded-xl shadow-lg transition-all duration-200 flex items-center space-x-3 ${hasPatternAnalysis
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
            {!hasPatternAnalysis && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <div className="card-modern rounded-xl p-6 max-w-md mx-auto">
                        <Target className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-primary mb-2">Pattern Analysis Required</h3>
                        <p className="text-secondary text-sm">
                            Please run pattern analysis first to generate accelerator recommendations.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Results */}
            {recommendations && renderRecommendations()}

            {/* No Recommendations State */}
            {!recommendations && !isLoading && hasPatternAnalysis && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                >
                    <div className="card-modern rounded-xl p-8 max-w-md mx-auto">
                        <Lightbulb className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-primary mb-2">Ready to Recommend</h3>
                        <p className="text-secondary">
                            Click the button above to generate AI-powered accelerator recommendations.
                        </p>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default AcceleratorRecommendations;
