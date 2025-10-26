import React from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    BarChart3,
    PieChart,
    Activity,
    Users,
    Target,
    Zap,
    ArrowUpRight,
    ArrowDownRight
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
    Cell,
    LineChart,
    Line,
    Area,
    AreaChart
} from 'recharts';

const Analytics = ({ analytics, data }) => {
    if (!analytics || !data) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
                    <p className="text-secondary">Loading analytics...</p>
                </div>
            </div>
        );
    }

    const sentimentData = Object.entries(analytics.bySentiment).map(([sentiment, count]) => ({
        sentiment: sentiment.charAt(0).toUpperCase() + sentiment.slice(1),
        count,
        fill: sentiment === 'positive' ? '#10B981' : sentiment === 'negative' ? '#EF4444' : '#6B7280'
    }));

    const complexityData = Object.entries(analytics.byComplexity).map(([complexity, count]) => ({
        complexity: complexity.charAt(0).toUpperCase() + complexity.slice(1),
        count,
        fill: complexity === 'high' ? '#EF4444' : complexity === 'medium' ? '#F59E0B' : '#10B981'
    }));

    const categoryData = Object.entries(analytics.byCategory).map(([category, count]) => ({
        category,
        count,
        percentage: ((count / analytics.totalRequests) * 100).toFixed(1)
    }));

    const priorityData = Object.entries(analytics.byPriority).map(([priority, count]) => ({
        priority: priority.charAt(0).toUpperCase() + priority.slice(1),
        count,
        fill: priority === 'high' ? '#EF4444' : priority === 'medium' ? '#F59E0B' : '#10B981'
    }));

    const trendData = analytics.trendData || [];

    const stats = [
        {
            title: 'Total Requests',
            value: analytics.totalRequests,
            icon: Users,
            color: 'blue',
            change: '+12%',
            trend: 'up'
        },
        {
            title: 'Categories',
            value: Object.keys(analytics.byCategory).length,
            icon: Target,
            color: 'green',
            change: '+3%',
            trend: 'up'
        },
        {
            title: 'Top Tags',
            value: analytics.topTags.length,
            icon: Zap,
            color: 'purple',
            change: '+8%',
            trend: 'up'
        },
        {
            title: 'Sentiment Score',
            value: `${Math.round((analytics.bySentiment.positive || 0) / analytics.totalRequests * 100)}%`,
            icon: TrendingUp,
            color: 'orange',
            change: '+5%',
            trend: 'up'
        }
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <div className="flex items-center justify-center space-x-3 mb-4">
                    <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl">
                        <TrendingUp className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-white">Analytics Dashboard</h1>
                </div>
                <p className="text-xl text-gray-300">
                    Comprehensive insights into customer requests and patterns
                </p>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + index * 0.1 }}
                            className="glass-effect rounded-xl p-6 card-hover"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-lg bg-${stat.color}-500/20`}>
                                    <Icon className={`h-6 w-6 text-${stat.color}-400`} />
                                </div>
                                <div className="flex items-center space-x-1 text-sm text-green-400 font-medium">
                                    {stat.trend === 'up' ? (
                                        <ArrowUpRight className="h-4 w-4" />
                                    ) : (
                                        <ArrowDownRight className="h-4 w-4" />
                                    )}
                                    <span>{stat.change}</span>
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                            <p className="text-gray-400">{stat.title}</p>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Category Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-effect rounded-xl p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-white">Request Categories</h3>
                        <BarChart3 className="h-5 w-5 text-blue-400" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={categoryData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis
                                dataKey="category"
                                stroke="#9CA3AF"
                                fontSize={12}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis stroke="#9CA3AF" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1F2937',
                                    border: '1px solid #374151',
                                    borderRadius: '8px',
                                    color: '#F9FAFB'
                                }}
                            />
                            <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Sentiment Analysis */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-effect rounded-xl p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-white">Sentiment Distribution</h3>
                        <PieChart className="h-5 w-5 text-green-400" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                            <Pie
                                data={sentimentData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ sentiment, percentage }) => `${sentiment} (${percentage}%)`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="count"
                            >
                                {sentimentData.map((entry, index) => (
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

                {/* Complexity Analysis */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-effect rounded-xl p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-white">Complexity Analysis</h3>
                        <Activity className="h-5 w-5 text-orange-400" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                            <Pie
                                data={complexityData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ complexity, percentage }) => `${complexity} (${percentage}%)`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="count"
                            >
                                {complexityData.map((entry, index) => (
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

                {/* Priority Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass-effect rounded-xl p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-white">Priority Distribution</h3>
                        <Target className="h-5 w-5 text-red-400" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={priorityData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis
                                dataKey="priority"
                                stroke="#9CA3AF"
                                fontSize={12}
                            />
                            <YAxis stroke="#9CA3AF" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1F2937',
                                    border: '1px solid #374151',
                                    borderRadius: '8px',
                                    color: '#F9FAFB'
                                }}
                            />
                            <Bar dataKey="count" fill="#EF4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Trend Analysis */}
            {trendData.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="glass-effect rounded-xl p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-white">Request Trends</h3>
                        <TrendingUp className="h-5 w-5 text-purple-400" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis
                                dataKey="month"
                                stroke="#9CA3AF"
                                fontSize={12}
                            />
                            <YAxis stroke="#9CA3AF" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1F2937',
                                    border: '1px solid #374151',
                                    borderRadius: '8px',
                                    color: '#F9FAFB'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#8B5CF6"
                                fill="url(#colorGradient)"
                                strokeWidth={2}
                            />
                            <defs>
                                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>
            )}

            {/* Top Tags */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="glass-effect rounded-xl p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white">Top Request Tags</h3>
                    <Zap className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="flex flex-wrap gap-3">
                    {analytics.topTags.map((tag, index) => (
                        <motion.span
                            key={tag.tag}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.8 + index * 0.1 }}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full text-sm text-blue-300 hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-200"
                        >
                            {tag.tag} ({tag.count})
                        </motion.span>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default Analytics;
