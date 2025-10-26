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
                    <p className="text-secondary">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const stats = [
        {
            title: 'Total Customer Requests',
            value: analytics.totalRequests,
            icon: Users,
            color: 'blue',
            change: `${analytics.totalRequests > 0 ? 'Active' : 'No Data'}`
        },
        {
            title: 'Available Accelerators',
            value: data.accelerators.length,
            icon: Target,
            color: 'green',
            change: `${data.accelerators.length} in Portfolio`
        },
        {
            title: 'Request Categories',
            value: Object.keys(analytics.byCategory).length,
            icon: BarChart3,
            color: 'purple',
            change: `${Object.keys(analytics.byCategory).length} Categories`
        },
        {
            title: 'Top Tags Identified',
            value: analytics.topTags.length,
            icon: Lightbulb,
            color: 'orange',
            change: `${analytics.topTags.length} Tags`
        }
    ];

    const categoryData = Object.entries(analytics.byCategory)
        .sort(([,a], [,b]) => b - a)
        .map(([category, count]) => ({
            category: category || 'Uncategorized',
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
                className="text-center mb-12"
            >
                <h1 className="text-4xl font-bold text-primary mb-4">
                    ServiceNow AI Accelerator Hub
                </h1>
                <p className="text-xl text-secondary">
                    Intelligent analysis of customer needs and accelerator recommendations
                </p>
                <div className="divider-line mt-8"></div>
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
                            className="card-modern rounded-xl p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 rounded-lg bg-gray-100">
                                    <Icon className="h-6 w-6 text-gray-600" />
                                </div>
                                <span className="text-sm text-green-600 font-medium flex items-center">
                                    <ArrowUpRight className="h-4 w-4 mr-1" />
                                    {stat.change}
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold text-primary mb-1">{stat.value}</h3>
                            <p className="text-secondary">{stat.title}</p>
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
                    className="card-modern rounded-xl p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-primary">Request Categories</h3>
                        <BarChart3 className="h-5 w-5 text-gray-600" />
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
                                    borderRadius: '8px',
                                    color: '#212121',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
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
                    className="card-modern rounded-xl p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-primary">Sentiment Analysis</h3>
                        <Activity className="h-5 w-5 text-green-600" />
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
                                    backgroundColor: '#FFFFFF',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '8px',
                                    color: '#212121',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
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
                className="card-modern rounded-xl p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-primary">Top Request Tags</h3>
                    <Zap className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="flex flex-wrap gap-3">
                    {analytics.topTags.map((tag, index) => (
                        <motion.span
                            key={tag.tag}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                            className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-full text-sm text-primary hover:bg-gray-200 transition-all duration-200"
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
