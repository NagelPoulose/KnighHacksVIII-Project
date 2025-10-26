import React from 'react';
import { motion } from 'framer-motion';
import {
    Brain,
    TrendingUp,
    Target,
    Lightbulb,
    CheckCircle,
    AlertCircle,
    Zap,
    ArrowRight,
    Sparkles
} from 'lucide-react';
import DebugInfo from './DebugInfo';

const PatternAnalysis = ({ analysis, onRunAnalysis, isLoading, data }) => {
    const renderAnalysisResults = () => {
        if (!analysis) return null;

        const emergingNeeds = analysis.emergingNeeds || [];
        const patterns = analysis.patterns || [];
        const trends = analysis.trends || [];
        const gaps = analysis.gaps || [];
        const recommendations = analysis.recommendations || [];

        return (
            <div className="space-y-8">
                {/* Emerging Needs */}
                {emergingNeeds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-modern rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Target className="h-6 w-6 text-gray-700" />
              </div>
              <h3 className="text-xl font-semibold text-primary">Emerging Customer Needs</h3>
            </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {emergingNeeds.map((need, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                                >
                                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-primary font-medium">{need}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Pattern Analysis */}
                {patterns.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-effect rounded-xl p-6"
                    >
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                                <Brain className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-white">Pattern Analysis</h3>
                        </div>
                        <div className="space-y-4">
                            {patterns.map((pattern, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 + index * 0.1 }}
                                    className="flex items-start space-x-3 p-4 bg-white/5 rounded-lg border border-white/10"
                                >
                                    <TrendingUp className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-white">{pattern}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Trend Analysis */}
                {trends.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-effect rounded-xl p-6"
                    >
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg">
                                <TrendingUp className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-white">Trend Analysis</h3>
                        </div>
                        <div className="space-y-4">
                            {trends.map((trend, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + index * 0.1 }}
                                    className="flex items-start space-x-3 p-4 bg-white/5 rounded-lg border border-white/10"
                                >
                                    <ArrowRight className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-white">{trend}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Gap Analysis */}
                {gaps.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-effect rounded-xl p-6"
                    >
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">
                                <AlertCircle className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-white">Gap Analysis</h3>
                        </div>
                        <div className="space-y-4">
                            {gaps.map((gap, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + index * 0.1 }}
                                    className="flex items-start space-x-3 p-4 bg-white/5 rounded-lg border border-white/10"
                                >
                                    <AlertCircle className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-white">{gap}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Priority Recommendations */}
                {recommendations.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="glass-effect rounded-xl p-6"
                    >
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg">
                                <Lightbulb className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-white">Priority Recommendations</h3>
                        </div>
                        <div className="space-y-4">
                            {recommendations.map((rec, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + index * 0.1 }}
                                    className="flex items-start space-x-3 p-4 bg-white/5 rounded-lg border border-white/10"
                                >
                                    <Sparkles className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-white">{rec}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Raw Analysis (if available) */}
                {analysis.rawResponse && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="glass-effect rounded-xl p-6"
                    >
                        <h3 className="text-xl font-semibold text-white mb-4">Detailed Analysis</h3>
                        <div className="bg-black/20 rounded-lg p-4 max-h-96 overflow-y-auto">
                            <pre className="text-gray-300 text-sm whitespace-pre-wrap">
                                {analysis.rawResponse}
                            </pre>
                        </div>
                    </motion.div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            {/* Debug Information */}
            <DebugInfo
                data={data}
                patternAnalysis={analysis}
                recommendations={null}
                isLoading={isLoading}
            />

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-3 bg-gray-100 rounded-xl">
            <Brain className="h-8 w-8 text-gray-700" />
          </div>
          <h1 className="text-4xl font-bold text-primary">Pattern Analysis</h1>
        </div>
        <p className="text-xl text-secondary">
          AI-powered analysis of customer needs and emerging patterns
        </p>
        <div className="divider-line mt-8"></div>
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
                    onClick={onRunAnalysis}
                    disabled={isLoading}
                    className="px-8 py-4 bg-gray-100 text-primary font-semibold rounded-xl border border-gray-200 hover:bg-gray-200 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3"
                >
                    {isLoading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                            <span>Analyzing Patterns...</span>
                        </>
                    ) : (
                        <>
                            <Brain className="h-5 w-5" />
                            <span>Run Pattern Analysis</span>
                            <Zap className="h-5 w-5" />
                        </>
                    )}
                </motion.button>
            </motion.div>

            {/* Results */}
            {analysis && renderAnalysisResults()}

            {/* No Analysis State */}
            {!analysis && !isLoading && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                >
                    <div className="glass-effect rounded-xl p-8 max-w-md mx-auto">
                        <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Ready to Analyze</h3>
                        <p className="text-gray-400">
                            Click the button above to start analyzing customer patterns and emerging needs.
                        </p>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default PatternAnalysis;
