import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    AlertCircle,
    Building,
    Calendar,
    Tag,
    TrendingUp,
    User,
    FileText,
    Zap,
    Target,
    Award,
    Clock,
    Info,
    ThumbsUp,
    ThumbsDown,
    Brain,
    Lightbulb
} from 'lucide-react';

const RequestDetail = ({ request, matchResult, onBack, onMarkReviewed }) => {
    const [hoveredField, setHoveredField] = useState(null);

    if (!request) return null;

    // Field explanations with specific value meanings
    const fieldExplanations = {
        category: {
            general: "Categorized based on the primary ServiceNow domain and technical area:",
            values: {
                'Automation': 'Assigned when request involves workflow automation, process optimization, robotic process automation (RPA), or AI-driven decision making',
                'Integration': 'Assigned when request requires connecting ServiceNow to external systems, APIs, third-party applications, or data synchronization',
                'Reporting': 'Assigned when request focuses on custom reports, dashboards, data visualization, analytics, or business intelligence needs',
                'Security': 'Assigned when request involves access control, authentication, compliance requirements, audit trails, or security enhancements',
                'User Experience': 'Assigned when request centers on UI/UX improvements, portal customization, mobile solutions, or user interface design',
                'General': 'Assigned when request spans multiple categories, doesn\'t fit a specific domain, or involves general platform configuration'
            }
        },
        priority: {
            general: "Priority is determined by business impact and urgency:",
            values: {
                'high': 'Assigned when: Request affects critical business operations, blocks revenue, has regulatory deadlines, impacts large user base (100+ users), or requires immediate attention due to system downtime or security risks',
                'medium': 'Assigned when: Request improves efficiency for specific teams (10-100 users), has flexible timeline (1-3 months), enhances existing functionality without blocking operations, or addresses moderate business needs',
                'low': 'Assigned when: Request is cosmetic/nice-to-have, affects small user group (<10 users), has no strict deadline, is an enhancement to non-critical features, or can be easily deferred without business impact'
            }
        },
        complexity: {
            general: "Complexity is based on technical requirements and implementation effort:",
            values: {
                'high': 'Assigned when: Request requires custom code development, multiple system integrations, significant architectural changes, affects core platform functionality, needs extensive testing (4+ weeks), or involves complex business logic with many edge cases',
                'medium': 'Assigned when: Request needs moderate customization (2-4 weeks), configuration of multiple components, some scripting, integration with 1-2 systems, or requires coordination across multiple teams',
                'low': 'Assigned when: Request can be fulfilled with out-of-box features, simple configuration changes (< 1 week), minimal or no custom code, uses existing accelerators, or requires only basic field/form modifications'
            }
        }
    };

    const getFieldTooltip = (field, value) => {
        // Check if we have AI reasoning for this field
        const aiReasoning = {
            priority: request.priorityReasoning,
            complexity: request.complexityReasoning,
            category: request.categoryReasoning
        };
        
        if (aiReasoning[field]) {
            // Show AI reasoning if available
            return (
                <div className="text-left">
                    <p className="font-semibold mb-2 flex items-center space-x-1">
                        <span className="text-green-400">🤖 AI Analysis:</span>
                    </p>
                    <p className="mb-2 capitalize"><strong>{value}</strong> was assigned because:</p>
                    <p className="italic">{aiReasoning[field]}</p>
                    {request.classificationConfidence && (
                        <p className="mt-2 text-xs text-gray-400">
                            Confidence: {request.classificationConfidence}%
                        </p>
                    )}
                </div>
            );
        }
        
        // Fallback to generic explanation
        const fieldInfo = fieldExplanations[field];
        if (!fieldInfo) return '';
        
        const specificValue = fieldInfo.values[value] || fieldInfo.values[value?.toLowerCase()];
        
        return (
            <div className="text-left">
                <p className="mb-2">{fieldInfo.general}</p>
                {specificValue && (
                    <div className="mt-2 pt-2 border-t border-gray-700">
                        <p className="font-semibold mb-1 capitalize">{value}:</p>
                        <p>{specificValue}</p>
                    </div>
                )}
            </div>
        );
    };

    const getConfidenceColor = (confidence) => {
        if (confidence >= 80) return 'text-green-600 bg-green-100';
        if (confidence >= 50) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };

    const getCoverageIcon = (level) => {
        switch (level) {
            case 'full': return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'partial': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
            case 'minimal': return <XCircle className="h-5 w-5 text-red-600" />;
            default: return <Clock className="h-5 w-5 text-gray-600" />;
        }
    };

    // Separate matching accelerators by coverage level - NO OVERLAP
    const matchingAccelerators = matchResult?.matchingAccelerators || [];
    
    // GOOD MATCHES (80+ match score): Accelerators that can fully cover the request
    // These are accelerators with matchScore >= 80
    const goodMatches = matchingAccelerators.filter(m => m.matchScore >= 80);
    
    // PARTIAL MATCHES (<80 match score): Accelerators that partially cover the request but need additional work
    // These are all other accelerators (matchScore < 80)
    // BUT NOT in goodMatches already
    const partialMatches = matchingAccelerators.filter(m => 
        !goodMatches.includes(m) && m.matchScore < 80
    );
    
    const hasMatches = matchingAccelerators.length > 0;

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={onBack}
                className="flex items-center space-x-2 text-secondary hover:text-primary transition-colors"
            >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Requests</span>
            </motion.button>

            {/* Request Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-modern p-8"
            >
                <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-3 bg-gray-100 rounded-xl">
                                <FileText className="h-8 w-8 text-gray-700" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-primary">
                                    {request.short_description || request.title || 'Untitled Request'}
                                </h1>
                                <p className="text-sm text-secondary mt-1">
                                    Request ID: {request.number || request.id || 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex flex-wrap items-center gap-3">
                            {request.reviewed ? (
                                <span className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Reviewed</span>
                                </span>
                            ) : (
                                <span className="flex items-center space-x-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium">
                                    <Clock className="h-4 w-4" />
                                    <span>Pending Review</span>
                                </span>
                            )}

                            {matchResult && (
                                <span className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium ${getConfidenceColor(matchResult.overallConfidence)}`}>
                                    {matchResult.canBeFulfilled && matchResult.overallConfidence >= 80 ? (
                                        <CheckCircle className="h-4 w-4" />
                                    ) : matchResult.canBeFulfilled && matchResult.overallConfidence >= 50 ? (
                                        <AlertCircle className="h-4 w-4" />
                                    ) : (
                                        <XCircle className="h-4 w-4" />
                                    )}
                                    <span>
                                        {matchResult.canBeFulfilled && matchResult.overallConfidence >= 80
                                            ? 'Fully Matched'
                                            : matchResult.canBeFulfilled && matchResult.overallConfidence >= 50
                                            ? 'Partial Match'
                                            : 'No Match'} ({matchResult.overallConfidence}%)
                                    </span>
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Mark/Unmark Reviewed Button */}
                    {!request.reviewed ? (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onMarkReviewed(request, true)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                        >
                            <CheckCircle className="h-5 w-5" />
                            <span>Mark as Reviewed</span>
                        </motion.button>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onMarkReviewed(request, false)}
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center space-x-2"
                        >
                            <XCircle className="h-5 w-5" />
                            <span>Unmark as Reviewed</span>
                        </motion.button>
                    )}
                </div>

                {/* Request Metadata Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
                    {request.company && (
                        <div className="flex items-center space-x-3">
                            <Building className="h-5 w-5 text-gray-500" />
                            <div>
                                <div className="text-xs text-secondary">Company</div>
                                <div className="text-sm font-medium text-primary">{request.company}</div>
                            </div>
                        </div>
                    )}
                    {request.category && (
                        <div className="flex items-center space-x-3">
                            <Tag className="h-5 w-5 text-gray-500" />
                            <div className="flex-1">
                                <div className="flex items-center space-x-1 text-xs text-secondary">
                                    <span>Category</span>
                                    <div className="relative group">
                                        <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                                            {getFieldTooltip('category', request.category)}
                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                                <div className="border-4 border-transparent border-t-gray-900"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-sm font-medium text-primary">{request.category}</div>
                            </div>
                        </div>
                    )}
                    {request.priority && (
                        <div className="flex items-center space-x-3">
                            <TrendingUp className="h-5 w-5 text-gray-500" />
                            <div className="flex-1">
                                <div className="flex items-center space-x-1 text-xs text-secondary">
                                    <span>Priority</span>
                                    <div className="relative group">
                                        <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                                            {getFieldTooltip('priority', request.priority)}
                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                                <div className="border-4 border-transparent border-t-gray-900"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-sm font-medium text-primary capitalize">{request.priority}</div>
                            </div>
                        </div>
                    )}
                    {request.complexity && (
                        <div className="flex items-center space-x-3">
                            <Zap className="h-5 w-5 text-gray-500" />
                            <div className="flex-1">
                                <div className="flex items-center space-x-1 text-xs text-secondary">
                                    <span>Complexity</span>
                                    <div className="relative group">
                                        <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                                            {getFieldTooltip('complexity', request.complexity)}
                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                                <div className="border-4 border-transparent border-t-gray-900"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-sm font-medium text-primary capitalize">{request.complexity}</div>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* AI Analysis Summary */}
            {matchResult && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card-modern p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200"
                >
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-purple-600 rounded-lg">
                            <Brain className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-primary">AI Analysis Summary</h2>
                            <p className="text-sm text-secondary">Google Gemini's assessment of this request</p>
                        </div>
                        <div className="ml-auto">
                            <span className={`px-4 py-2 rounded-lg font-bold text-lg ${getConfidenceColor(matchResult.overallConfidence)}`}>
                                {matchResult.overallConfidence}% Confidence
                            </span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Can Be Fulfilled? */}
                        <div className="p-4 bg-white rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-2 mb-2">
                                {matchResult.canBeFulfilled ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-600" />
                                )}
                                <h3 className="font-semibold text-primary">
                                    {matchResult.canBeFulfilled ? 'Can Be Fulfilled' : 'Cannot Be Fulfilled'}
                                </h3>
                            </div>
                            <p className="text-sm text-secondary">
                                {matchResult.canBeFulfilled 
                                    ? 'AI determined that existing accelerators can handle this request.'
                                    : 'AI found no existing accelerators that adequately cover this request.'}
                            </p>
                        </div>

                        {/* Match Count */}
                        <div className="p-4 bg-white rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-2 mb-2">
                                <Target className="h-5 w-5 text-blue-600" />
                                <h3 className="font-semibold text-primary">Matching Accelerators</h3>
                            </div>
                            <p className="text-sm text-secondary">
                                Found <strong>{matchingAccelerators.length}</strong> accelerator(s) with coverage ranging from minimal to full.
                            </p>
                        </div>
                    </div>

                    {/* AI Recommendation */}
                    {matchResult.recommendation && (
                        <div className="mt-4 p-4 bg-white rounded-lg border-2 border-purple-300">
                            <div className="flex items-center space-x-2 mb-2">
                                <Lightbulb className="h-5 w-5 text-purple-600" />
                                <h3 className="font-semibold text-primary">Gemini's Recommendation</h3>
                            </div>
                            <p className="text-sm text-secondary italic">
                                "{matchResult.recommendation}"
                            </p>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Request Description */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="card-modern p-6"
            >
                <h2 className="text-xl font-semibold text-primary mb-4 flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Request Description</span>
                </h2>
                <p className="text-secondary leading-relaxed whitespace-pre-wrap">
                    {request.description || request.u_description || 'No description provided'}
                </p>
            </motion.div>

            {/* Accelerator Analysis */}
            {matchResult && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                >
                    {/* Existing Accelerators That Help */}
                    {goodMatches.length > 0 && (
                        <div className="card-modern p-6">
                            <h2 className="text-xl font-semibold text-primary mb-4 flex items-center space-x-2">
                                <ThumbsUp className="h-5 w-5 text-green-600" />
                                <span>Existing Accelerators That Can Help</span>
                                <span className="text-sm font-normal text-secondary">({goodMatches.length} found)</span>
                            </h2>
                            <div className="space-y-4">
                                {goodMatches.map((match, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + index * 0.1 }}
                                        className="p-4 bg-green-50 rounded-lg border border-green-200"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center space-x-3">
                                                {getCoverageIcon(match.coverageLevel)}
                                                <h3 className="text-lg font-semibold text-primary">{match.name}</h3>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getConfidenceColor(match.matchScore)}`}>
                                                    {match.matchScore}% Match
                                                </span>
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                    {match.coverageLevel} coverage
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div>
                                                <span className="text-xs font-semibold text-gray-700">How it helps:</span>
                                                <p className="text-sm text-secondary mt-1">{match.reasoning}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Partial Matches */}
                    {partialMatches.length > 0 && (
                        <div className="card-modern p-6">
                            <h2 className="text-xl font-semibold text-primary mb-4 flex items-center space-x-2">
                                <AlertCircle className="h-5 w-5 text-yellow-600" />
                                <span>Accelerators With Partial Coverage</span>
                                <span className="text-sm font-normal text-secondary">({partialMatches.length} found)</span>
                            </h2>
                            <div className="space-y-4">
                                {partialMatches.map((match, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + index * 0.1 }}
                                        className="p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center space-x-3">
                                                {getCoverageIcon(match.coverageLevel)}
                                                <h3 className="text-lg font-semibold text-primary">{match.name}</h3>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getConfidenceColor(match.matchScore)}`}>
                                                    {match.matchScore}% Match
                                                </span>
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                                    {match.coverageLevel} coverage
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div>
                                                <span className="text-xs font-semibold text-gray-700">How it helps:</span>
                                                <p className="text-sm text-secondary mt-1">{match.reasoning}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* What's Missing / Problems */}
                    {matchResult.gapAnalysis && (
                        <div className="card-modern p-6">
                            <h2 className="text-xl font-semibold text-primary mb-4 flex items-center space-x-2">
                                <ThumbsDown className="h-5 w-5 text-red-600" />
                                <span>What's Missing - Potential Problems</span>
                            </h2>
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-start space-x-3">
                                    <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 mb-2">Gap Identified:</p>
                                        <p className="text-sm text-secondary">{matchResult.gapAnalysis}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* No Matches Found */}
                    {!hasMatches && matchResult.gapAnalysis && (
                        <div className="card-modern p-6">
                            <h2 className="text-xl font-semibold text-primary mb-4 flex items-center space-x-2">
                                <XCircle className="h-5 w-5 text-red-600" />
                                <span>No Matching Accelerators Found</span>
                            </h2>
                            <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
                                <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                                <p className="text-sm font-medium text-gray-900 mb-2">This request cannot be fulfilled by any existing accelerator</p>
                                <p className="text-sm text-secondary">{matchResult.gapAnalysis}</p>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Analysis Metadata */}
            {matchResult && matchResult.analyzedAt && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className={`card-modern p-4 ${matchResult.usedFallback ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}
                >
                    <div className="flex items-center justify-between text-xs text-secondary">
                        <span className="flex items-center space-x-1">
                            {matchResult.usedFallback ? (
                                <>
                                    <span className="text-yellow-600">⚠️ Fallback Mode:</span>
                                    <span className="text-yellow-700 font-medium">Keyword Matching (AI Failed)</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-green-600">🤖 AI-Powered Analysis</span>
                                </>
                            )}
                        </span>
                        <span>Analyzed: {new Date(matchResult.analyzedAt).toLocaleString()}</span>
                        <span>Confidence: {matchResult.overallConfidence}%</span>
                    </div>
                    {matchResult.usedFallback && matchResult.fallbackReason && (
                        <div className="mt-2 text-xs text-yellow-700">
                            <strong>Reason:</strong> {matchResult.fallbackReason}
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default RequestDetail;

