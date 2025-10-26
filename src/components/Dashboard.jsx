import React from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    Users,
    Lightbulb,
    Target,
    BarChart3,
    Activity,
    Zap,
    ArrowUpRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = ({ data, analytics }) => {
    if (!data || !analytics) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
                    <p className="text-gray-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const stats = [
        {
            title: 'Total Requests',
            value: analytics.totalRequests,
            icon: Users,
            color: 'blue',
            change: '+12%'
        },
        {
            title: 'Active Accelerators',
            value: data.accelerators.length,
            icon: Target,
            color: 'green',
            change: '+5%'
        },
        {
            title: 'Patterns Identified',
            value: Object.keys(analytics.byCategory).length,
            icon: BarChart3,
            color: 'purple',
            change: '+8%'
        },
        {
            title: 'AI Insights',
            value: analytics.topTags.length,
            icon: Lightbulb,
            color: 'orange',
            change: '+15%'
        }
    ];

    const categoryData = Object.entries(analytics.byCategory).map(([category, count]) => ({
        category,
        count,
        percentage: ((count / analytics.totalRequests) * 100).toFixed(1)
    }));

    const sentimentData = Object.entries(analytics.bySentiment).map(([sentiment, count]) => ({
        sentiment,
        count,
        fill: sentiment === 'positive' ? '#10B981' : sentiment === 'negative' ? '#EF4444' : '#6B7280'
    }));

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <h1 className="text-4xl font-bold text-white mb-4">
                    ServiceNow AI Accelerator Hub
                </h1>
                <p className="text-xl text-gray-300">
                    Intelligent analysis of customer needs and accelerator recommendations
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
                                <span className="text-sm text-green-400 font-medium flex items-center">
                                    <ArrowUpRight className="h-4 w-4 mr-1" />
                                    {stat.change}
                                </span>
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
                        <h3 className="text-xl font-semibold text-white">Sentiment Analysis</h3>
                        <Activity className="h-5 w-5 text-green-400" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
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
                        </PieChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Top Tags */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
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
                            transition={{ delay: 0.5 + index * 0.1 }}
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

export default Dashboard;
