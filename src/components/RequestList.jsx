import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    CheckCircle,
    XCircle,
    AlertCircle,
    Eye,
    ChevronRight,
    Filter,
    Search,
    Clock,
    Building,
    Tag,
    TrendingUp
} from 'lucide-react';

const RequestList = ({ requests, matchResults, onSelectRequest, onMarkReviewed }) => {
    // Load initial states from localStorage
    const [filter, setFilter] = useState(() => {
        return localStorage.getItem('requestListFilter') || 'all';
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('priority');
    const [showAiOnly, setShowAiOnly] = useState(() => {
        return localStorage.getItem('showAiOnly') === 'true';
    });

    // Save states to localStorage when they change
    useEffect(() => {
        localStorage.setItem('showAiOnly', showAiOnly);
    }, [showAiOnly]);


    useEffect(() => {
        localStorage.setItem('requestListFilter', filter);
    }, [filter]);

    // Merge requests with their match results
    const enrichedRequests = requests.map(request => {
        const matchResult = matchResults?.find(m => 
            m.requestId === (request.id || request.number)
        );
        return {
            ...request,
            matchResult,
            reviewed: request.reviewed || false
        };
    });

    // Filter and sort requests
    const filteredRequests = enrichedRequests.filter(request => {
        // AI-only filter (show only requests with AI analysis)
        if (showAiOnly) {
            const hasAiAnalysis = request.matchResult && 
                                 request.priorityReasoning && 
                                 request.complexityReasoning;
            if (!hasAiAnalysis) return false;
        }

        // Search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = 
                (request.short_description || '').toLowerCase().includes(searchLower) ||
                (request.description || '').toLowerCase().includes(searchLower) ||
                (request.u_description || '').toLowerCase().includes(searchLower) ||
                (request.company || '').toLowerCase().includes(searchLower);
            
            if (!matchesSearch) return false;
        }

        // Category filter
        if (selectedCategory !== 'all' && request.category !== selectedCategory) {
            return false;
        }

        // Status filter
        if (filter === 'toReview' && request.reviewed) return false;
        if (filter === 'reviewed' && !request.reviewed) return false;
        if (filter === 'matched' && (!request.matchResult?.canBeFulfilled || request.matchResult?.overallConfidence < 50)) return false;
        if (filter === 'unmatched' && (request.matchResult?.canBeFulfilled && request.matchResult?.overallConfidence >= 50)) return false;

        return true;
    }).sort((a, b) => {
        // Sort by selected criteria
        if (sortBy === 'priority') {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const aPriority = priorityOrder[a.priority?.toLowerCase()] || 0;
            const bPriority = priorityOrder[b.priority?.toLowerCase()] || 0;
            return bPriority - aPriority; // High to low
        } else if (sortBy === 'match') {
            const aConfidence = a.matchResult?.overallConfidence || 0;
            const bConfidence = b.matchResult?.overallConfidence || 0;
            return aConfidence - bConfidence; // Low to high (gaps first)
        } else if (sortBy === 'date') {
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); // Newest first
        }
        return 0;
    });

    // Get unique categories
    const categories = ['all', ...new Set(requests.map(r => r.category).filter(Boolean))];

    // Statistics
    const stats = {
        total: enrichedRequests.length,
        toReview: enrichedRequests.filter(r => !r.reviewed).length,
        reviewed: enrichedRequests.filter(r => r.reviewed).length,
        matched: enrichedRequests.filter(r => r.matchResult?.canBeFulfilled && r.matchResult?.overallConfidence >= 50).length,
        unmatched: enrichedRequests.filter(r => !r.matchResult?.canBeFulfilled || r.matchResult?.overallConfidence < 50).length
    };

    const getPriorityBadge = (priority) => {
        const priorityLower = priority?.toLowerCase();
        const styles = {
            high: 'bg-red-100 text-red-700 border-red-200',
            medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            low: 'bg-green-100 text-green-700 border-green-200'
        };
        
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium border ${styles[priorityLower] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {priority ? `${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority` : 'No Priority'}
            </span>
        );
    };

    const getMatchBadge = (matchResult) => {
        if (!matchResult) {
            return (
                <span className="flex items-center space-x-1 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                    <Clock className="h-3 w-3" />
                    <span>Analyzing...</span>
                </span>
            );
        }

        if (matchResult.canBeFulfilled && matchResult.overallConfidence >= 80) {
            return (
                <span className="flex items-center space-x-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    <CheckCircle className="h-3 w-3" />
                    <span>Fully Matched ({matchResult.overallConfidence}%)</span>
                </span>
            );
        }

        if (matchResult.canBeFulfilled && matchResult.overallConfidence >= 50) {
            return (
                <span className="flex items-center space-x-1 text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                    <AlertCircle className="h-3 w-3" />
                    <span>Partial Match ({matchResult.overallConfidence}%)</span>
                </span>
            );
        }

        return (
            <span className="flex items-center space-x-1 text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                <XCircle className="h-3 w-3" />
                <span>No Match</span>
            </span>
        );
    };

    const getReviewBadge = (reviewed) => {
        if (reviewed) {
            return (
                <span className="flex items-center space-x-1 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    <CheckCircle className="h-3 w-3" />
                    <span>Reviewed</span>
                </span>
            );
        }
        return (
            <span className="flex items-center space-x-1 text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                <Clock className="h-3 w-3" />
                <span>To Review</span>
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <div className="flex items-center justify-center space-x-3 mb-4">
                    <div className="p-3 bg-gray-100 rounded-xl">
                        <FileText className="h-8 w-8 text-gray-700" />
                    </div>
                    <h1 className="text-4xl font-bold text-primary">Customer Requests</h1>
                </div>
                <p className="text-xl text-secondary">
                    Review A2E requests and match them with existing accelerators
                </p>
                <div className="divider-line mt-8"></div>
            </motion.div>

            {/* Statistics Cards */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 md:grid-cols-5 gap-4"
            >
                <div className="card-modern p-4 text-center">
                    <div className="text-2xl font-bold text-primary">{stats.total}</div>
                    <div className="text-sm text-secondary">Total Requests</div>
                </div>
                <div className="card-modern p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats.toReview}</div>
                    <div className="text-sm text-secondary">To Review</div>
                </div>
                <div className="card-modern p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.reviewed}</div>
                    <div className="text-sm text-secondary">Reviewed</div>
                </div>
                <div className="card-modern p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.matched}</div>
                    <div className="text-sm text-secondary">Matched</div>
                </div>
                <div className="card-modern p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.unmatched}</div>
                    <div className="text-sm text-secondary">Unmatched</div>
                </div>
            </motion.div>

            {/* Filters and Search */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card-modern p-6 space-y-4"
            >
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search requests..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Filter Buttons */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            filter === 'all'
                                ? 'bg-gray-700 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        All ({stats.total})
                    </button>
                    <button
                        onClick={() => setFilter('toReview')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            filter === 'toReview'
                                ? 'bg-orange-600 text-white'
                                : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                        }`}
                    >
                        To Review ({stats.toReview})
                    </button>
                    <button
                        onClick={() => setFilter('reviewed')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            filter === 'reviewed'
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                        }`}
                    >
                        Reviewed ({stats.reviewed})
                    </button>
                    <button
                        onClick={() => setFilter('matched')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            filter === 'matched'
                                ? 'bg-green-600 text-white'
                                : 'bg-green-100 text-green-600 hover:bg-green-200'
                        }`}
                    >
                        Matched ({stats.matched})
                    </button>
                    <button
                        onClick={() => setFilter('unmatched')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            filter === 'unmatched'
                                ? 'bg-red-600 text-white'
                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                        }`}
                    >
                        Unmatched ({stats.unmatched})
                    </button>
                </div>

                {/* AI Analysis Filter Checkbox */}
                <div className="flex items-center space-x-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <input
                        type="checkbox"
                        id="aiOnlyFilter"
                        checked={showAiOnly}
                        onChange={(e) => setShowAiOnly(e.target.checked)}
                        className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                    />
                    <label htmlFor="aiOnlyFilter" className="flex items-center space-x-2 cursor-pointer">
                        <span className="text-2xl">🤖</span>
                        <div>
                            <div className="text-sm font-semibold text-purple-900">Show Only AI-Analyzed Requests</div>
                            <div className="text-xs text-purple-700">Display only the 5 requests with full Google Gemini analysis</div>
                        </div>
                    </label>
                    <div className="ml-auto px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-bold">
                        {enrichedRequests.filter(r => r.matchResult && r.priorityReasoning).length} Available
                    </div>
                </div>

                {/* Category and Sort Filters */}
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <Filter className="h-4 w-4 text-gray-500" />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>
                                    {cat === 'all' ? 'All Categories' : cat}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Sort by:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="priority">Priority (High to Low)</option>
                            <option value="match">Match Quality (Gaps First)</option>
                            <option value="date">Date (Newest First)</option>
                        </select>
                    </div>
                </div>
            </motion.div>

            {/* Request List */}
            <div className="space-y-4">
                <AnimatePresence>
                    {filteredRequests.map((request, index) => (
                        <motion.div
                            key={request.id || request.number || index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05 }}
                            className="card-modern p-6 hover:shadow-lg transition-all cursor-pointer"
                            onClick={() => onSelectRequest(request)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    {/* Request Title */}
                                    <div className="flex items-start space-x-3 mb-3">
                                        <FileText className="h-5 w-5 text-gray-500 mt-1 flex-shrink-0" />
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-primary mb-1">
                                                {request.short_description || request.title || 'Untitled Request'}
                                            </h3>
                                            <p className="text-sm text-secondary line-clamp-2">
                                                {request.description || request.u_description || 'No description available'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Metadata */}
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-secondary">
                                        {request.company && (
                                            <div className="flex items-center space-x-1">
                                                <Building className="h-4 w-4" />
                                                <span>{request.company}</span>
                                            </div>
                                        )}
                                        {request.category && (
                                            <div className="flex items-center space-x-1">
                                                <Tag className="h-4 w-4" />
                                                <span>{request.category}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Badges */}
                                    <div className="flex flex-wrap items-center gap-2 mt-3">
                                        {request.priority && getPriorityBadge(request.priority)}
                                        {getReviewBadge(request.reviewed)}
                                        {getMatchBadge(request.matchResult)}
                                    </div>
                                </div>

                                {/* View Details Button */}
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors ml-4"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelectRequest(request);
                                    }}
                                >
                                    <ChevronRight className="h-5 w-5 text-gray-600" />
                                </motion.button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredRequests.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="card-modern p-12 text-center"
                    >
                        <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-primary mb-2">No Requests Found</h3>
                        <p className="text-secondary">Try adjusting your filters or search term</p>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default RequestList;

