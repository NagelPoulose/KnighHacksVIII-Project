import React from 'react';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    TrendingUp,
    Target,
    Layers,
    XCircle,
    AlertCircle,
    BarChart3,
    PieChart,
    ArrowRight
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart as RechartsPieChart,
    Pie,
    Cell
} from 'recharts';

const GapAnalysis = ({ gapAnalysis, onViewRequest }) => {
    if (!gapAnalysis) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
                    <p className="text-secondary">Loading gap analysis...</p>
                </div>
            </div>
        );
    }

    const { unmatched, partiallyMatched, fullyMatched, total, averageConfidence } = gapAnalysis;

    // Prepare data for charts
    const matchDistributionData = [
        { name: 'Unmatched', value: unmatched.count, fill: '#EF4444' },
        { name: 'Partial Match', value: partiallyMatched.count, fill: '#F59E0B' },
        { name: 'Fully Matched', value: fullyMatched.count, fill: '#10B981' }
    ];

    // Group unmatched requests by category
    const unmatchedByCategory = unmatched.requests.reduce((acc, req) => {
        const cat = req.category || 'Uncategorized';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {});

    const categoryData = Object.entries(unmatchedByCategory).map(([category, count]) => ({
        category,
        count
    })).sort((a, b) => b.count - a.count);

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <div className="flex items-center justify-center space-x-3 mb-4">
                    <div className="p-3 bg-gradient-to-r from-red-500 to-orange-600 rounded-xl">
                        <AlertTriangle className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-primary">Gap Analysis</h1>
                </div>
                <p className="text-xl text-secondary">
                    Identify requests that cannot be fulfilled by existing accelerators
                </p>
                <div className="divider-line mt-8"></div>
            </motion.div>

            {/* Summary Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-6"
            >
                <div className="card-modern p-6">
                    <div className="flex items-center justify-between mb-2">
                        <Layers className="h-8 w-8 text-blue-500" />
                        <span className="text-3xl font-bold text-primary">{total}</span>
                    </div>
                    <div className="text-sm text-secondary">Total Requests</div>
                </div>

                <div className="card-modern p-6">
                    <div className="flex items-center justify-between mb-2">
                        <XCircle className="h-8 w-8 text-red-500" />
                        <span className="text-3xl font-bold text-red-600">{unmatched.count}</span>
                    </div>
                    <div className="text-sm text-secondary">Unmatched ({unmatched.percentage}%)</div>
                </div>

                <div className="card-modern p-6">
                    <div className="flex items-center justify-between mb-2">
                        <AlertCircle className="h-8 w-8 text-yellow-500" />
                        <span className="text-3xl font-bold text-yellow-600">{partiallyMatched.count}</span>
                    </div>
                    <div className="text-sm text-secondary">Partial Match ({partiallyMatched.percentage}%)</div>
                </div>

                <div className="card-modern p-6">
                    <div className="flex items-center justify-between mb-2">
                        <Target className="h-8 w-8 text-purple-500" />
                        <span className="text-3xl font-bold text-purple-600">{averageConfidence}%</span>
                    </div>
                    <div className="text-sm text-secondary">Avg Confidence</div>
                </div>
            </motion.div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Match Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="card-modern p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-primary">Match Distribution</h3>
                        <PieChart className="h-5 w-5 text-blue-500" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                            <Pie
                                data={matchDistributionData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                                outerRadius={80}
                                dataKey="value"
                            >
                                {matchDistributionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1F2937',
                                    border: '1px solid #374151',
                                    borderRadius: '8px',
                                    color: '#F9FAFB'
                                }}
                            />
                        </RechartsPieChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Unmatched by Category */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="card-modern p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-primary">Unmatched by Category</h3>
                        <BarChart3 className="h-5 w-5 text-red-500" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={categoryData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis
                                dataKey="category"
                                stroke="#6B7280"
                                fontSize={12}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis stroke="#6B7280" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#FFFFFF',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '8px'
                                }}
                            />
                            <Bar dataKey="count" fill="#EF4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Critical Gaps - Unmatched Requests */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="card-modern p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-primary flex items-center space-x-2">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                        <span>Critical Gaps - Unmatched Requests ({unmatched.count})</span>
                    </h3>
                </div>

                {unmatched.count === 0 ? (
                    <div className="text-center py-12">
                        <Target className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-primary mb-2">No Critical Gaps!</h4>
                        <p className="text-secondary">All customer requests can be fulfilled by existing accelerators.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {unmatched.requests.slice(0, 10).map((request, index) => (
                            <motion.div
                                key={request.requestId || index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + index * 0.05 }}
                                className="p-4 bg-red-50 border border-red-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
                                onClick={() => onViewRequest && onViewRequest(request)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-primary mb-2">
                                            {request.short_description || request.title || 'Untitled Request'}
                                        </h4>
                                        <p className="text-sm text-secondary line-clamp-2 mb-2">
                                            {request.description || request.u_description || 'No description'}
                                        </p>
                                        {request.gapAnalysis && (
                                            <div className="mt-2 p-2 bg-white rounded text-xs text-secondary">
                                                <strong>Gap:</strong> {request.gapAnalysis}
                                            </div>
                                        )}
                                        <div className="flex items-center space-x-4 mt-2 text-xs text-secondary">
                                            {request.category && (
                                                <span className="flex items-center space-x-1">
                                                    <Target className="h-3 w-3" />
                                                    <span>{request.category}</span>
                                                </span>
                                            )}
                                            {request.matchResult && (
                                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full">
                                                    {request.matchResult.overallConfidence}% Confidence
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-gray-400 ml-4 flex-shrink-0" />
                                </div>
                            </motion.div>
                        ))}

                        {unmatched.count > 10 && (
                            <div className="text-center text-sm text-secondary">
                                Showing 10 of {unmatched.count} unmatched requests
                            </div>
                        )}
                    </div>
                )}
            </motion.div>

            {/* Opportunity Summary */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="card-modern p-6 bg-gradient-to-r from-purple-50 to-blue-50"
            >
                <div className="flex items-start space-x-4">
                    <div className="p-3 bg-white rounded-lg">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-primary mb-2">Opportunity Summary</h3>
                        <p className="text-secondary mb-4">
                            {unmatched.count > 0 ? (
                                <>
                                    <strong>{unmatched.count} requests ({unmatched.percentage}%)</strong> cannot be fulfilled by existing accelerators.
                                    These represent opportunities to develop new accelerators that address unmet customer needs.
                                </>
                            ) : (
                                <>
                                    All customer requests can be matched to existing accelerators! Your portfolio is comprehensive.
                                </>
                            )}
                        </p>
                        {partiallyMatched.count > 0 && (
                            <p className="text-secondary">
                                Additionally, <strong>{partiallyMatched.count} requests ({partiallyMatched.percentage}%)</strong> have only partial matches,
                                indicating opportunities to enhance existing accelerators.
                            </p>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default GapAnalysis;

