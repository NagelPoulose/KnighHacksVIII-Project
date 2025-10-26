// FastAPI Backend Service for Parallel Accelerator Analysis
const FASTAPI_BASE_URL = 'http://localhost:8000';

class FastAPIService {
    constructor() {
        this.baseURL = FASTAPI_BASE_URL;
        this.isBackendAvailable = false;
        this.checkBackendHealth();
    }

    async checkBackendHealth() {
        try {
            const response = await fetch(`${this.baseURL}/status`);
            if (response.ok) {
                this.isBackendAvailable = true;
                console.log('✅ FastAPI backend is available');
            }
        } catch (error) {
            this.isBackendAvailable = false;
            console.warn('⚠️ FastAPI backend not available, falling back to direct AI calls');
        }
    }

    async analyzeParallel(customerRequests, accelerators, onProgress = null) {
        if (!this.isBackendAvailable) {
            console.log('🔄 Backend not available, using fallback method');
            return this.fallbackAnalysis(customerRequests, accelerators);
        }

        try {
            console.log('🚀 Starting parallel analysis via FastAPI backend...');
            console.log(`📊 Processing ${customerRequests.length} requests across 5 sections`);

            // For large datasets, process in chunks to avoid timeouts
            const CHUNK_SIZE = 100; // Process 100 requests at a time
            const chunks = [];

            for (let i = 0; i < customerRequests.length; i += CHUNK_SIZE) {
                chunks.push(customerRequests.slice(i, i + CHUNK_SIZE));
            }

            console.log(`📦 Processing ${chunks.length} chunks with controlled parallelism (5 ADK agents per chunk)`);

            const startTime = Date.now();
            let completedChunks = 0;

            // Process chunks in batches of 2 to avoid overwhelming the API
            const PARALLEL_CHUNKS = 2;  // Process 2 chunks at a time
            const allResults = [];

            for (let batchStart = 0; batchStart < chunks.length; batchStart += PARALLEL_CHUNKS) {
                const batchEnd = Math.min(batchStart + PARALLEL_CHUNKS, chunks.length);
                const batchChunks = chunks.slice(batchStart, batchEnd);

                console.log(`🔄 Processing batch ${Math.floor(batchStart / PARALLEL_CHUNKS) + 1}/${Math.ceil(chunks.length / PARALLEL_CHUNKS)} (${batchChunks.length} chunks)`);

                const chunkPromises = batchChunks.map(async (chunk, batchIdx) => {
                    const i = batchStart + batchIdx;
                    console.log(`🚀 Starting chunk ${i + 1}/${chunks.length} (${chunk.length} requests)`);

                    try {
                        const response = await fetch(`${this.baseURL}/analyze-parallel`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                requests: chunk,
                                accelerators: accelerators
                            })
                        });

                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }

                        const result = await response.json();

                        completedChunks++;
                        console.log(`✅ Chunk ${i + 1} completed (${completedChunks}/${chunks.length})`);

                        // Report progress
                        if (onProgress) {
                            onProgress({
                                currentChunk: completedChunks,
                                totalChunks: chunks.length,
                                currentRequests: chunk.length,
                                totalRequests: customerRequests.length,
                                percentage: Math.round((completedChunks / chunks.length) * 100)
                            });
                        }

                        return result;
                    } catch (error) {
                        console.error(`❌ Chunk ${i + 1} failed:`, error);
                        throw error;
                    }
                });

                // Wait for this batch to complete
                const batchResults = await Promise.all(chunkPromises);
                allResults.push(...batchResults);

                console.log(`✅ Batch ${Math.floor(batchStart / PARALLEL_CHUNKS) + 1} complete`);
            }

            const processingTime = Date.now() - startTime;
            console.log(`⚡ Total processing time: ${processingTime}ms (${chunks.length} chunks processed in parallel!)`);

            // Consolidate results from all chunks
            const consolidatedResult = this.consolidateChunkResults(allResults, processingTime);

            console.log('✅ All chunks processed successfully');
            return consolidatedResult;

        } catch (error) {
            console.error('❌ FastAPI analysis failed:', error);
            console.log('🔄 Falling back to direct AI analysis...');
            return this.fallbackAnalysis(customerRequests, accelerators);
        }
    }

    consolidateChunkResults(chunkResults, totalProcessingTime) {
        // Merge results from all chunks
        const allEmergingNeeds = [];
        const allPatterns = [];
        const allTrends = [];
        const allGaps = [];
        const allRecommendations = [];
        let totalConfidence = 0;
        let totalDataPoints = 0;

        chunkResults.forEach(result => {
            const consolidated = result.consolidated_result?.consolidated_analysis || result.consolidated_analysis || {};

            allEmergingNeeds.push(...(consolidated.emergingNeeds || []));
            allPatterns.push(...(consolidated.patterns || []));
            allTrends.push(...(consolidated.trends || []));
            allGaps.push(...(consolidated.gaps || []));
            allRecommendations.push(...(consolidated.recommendations || []));

            totalConfidence += consolidated.overallConfidence || 0;
            totalDataPoints += consolidated.totalDataPoints || 0;
        });

        return {
            emergingNeeds: allEmergingNeeds.slice(0, 10), // Top 10
            patterns: allPatterns.slice(0, 10),
            trends: allTrends.slice(0, 10),
            gaps: allGaps.slice(0, 10),
            recommendations: allRecommendations.slice(0, 10),
            overallConfidence: chunkResults.length > 0 ? totalConfidence / chunkResults.length : 0,
            dataQuality: "high",
            sampleSize: totalDataPoints,
            metrics: {
                processingTime: totalProcessingTime,
                dataPointsAnalyzed: totalDataPoints,
                analysisDate: new Date().toISOString(),
                agentVersion: '3.0-parallel-chunked',
                chunksProcessed: chunkResults.length,
                backendUsed: 'FastAPI'
            },
            rawResponse: "Parallel analysis via FastAPI backend with chunked processing"
        };
    }

    transformFastAPIResult(fastapiResult, processingTime) {
        const consolidated = fastapiResult.consolidated_result.consolidated_analysis;

        return {
            emergingNeeds: consolidated.emergingNeeds || [],
            patterns: consolidated.patterns || [],
            trends: consolidated.trends || [],
            gaps: consolidated.gaps || [],
            recommendations: consolidated.recommendations || [],
            overallConfidence: consolidated.overallConfidence || 0,
            dataQuality: "high",
            sampleSize: consolidated.totalDataPoints || 0,
            metrics: {
                processingTime: processingTime,
                dataPointsAnalyzed: consolidated.totalDataPoints || 0,
                analysisDate: new Date().toISOString(),
                agentVersion: '3.0-parallel',
                sectionsProcessed: consolidated.sectionsProcessed || 5,
                backendUsed: 'FastAPI'
            },
            sectionResults: fastapiResult.consolidated_result.section_results.map(section => ({
                sectionId: section.section_id,
                processingTime: section.processing_time,
                dataPoints: section.data_points_analyzed,
                confidence: section.overall_confidence,
                emergingNeeds: section.emerging_needs,
                patterns: section.patterns,
                trends: section.trends,
                gaps: section.gaps,
                recommendations: section.recommendations
            })),
            rawResponse: "Parallel analysis via FastAPI backend"
        };
    }

    async fallbackAnalysis(customerRequests, accelerators) {
        console.log('🔄 Using fallback analysis (original method)');

        // Import the original agents
        const { PatternAnalysisAgent } = await import('./aiAgents.js');
        const patternAgent = new PatternAnalysisAgent();

        // Prepare data in the expected format
        const customerData = {
            summary: {
                totalRequests: customerRequests.length,
                topCategories: this.getTopCategories(customerRequests),
                commonTags: this.getCommonTags(customerRequests),
                sentimentDistribution: this.getSentimentDistribution(customerRequests)
            },
            customerRequests: customerRequests.map(req => ({
                number: req.number || req.id,
                title: req.initiative_title || req.title,
                description: req.description || req.u_description,
                capability: req.capability,
                category: req.primary_category,
                company: req.company
            }))
        };

        return await patternAgent.analyzePatterns(customerData);
    }

    async getResults() {
        if (!this.isBackendAvailable) {
            throw new Error('Backend not available');
        }

        try {
            const response = await fetch(`${this.baseURL}/results`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching results:', error);
            throw error;
        }
    }

    async getSectionResults(sectionId) {
        if (!this.isBackendAvailable) {
            throw new Error('Backend not available');
        }

        try {
            const response = await fetch(`${this.baseURL}/results/${sectionId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching section ${sectionId} results:`, error);
            throw error;
        }
    }

    async getStatus() {
        try {
            const response = await fetch(`${this.baseURL}/status`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching status:', error);
            return { status: 'offline', error: error.message };
        }
    }

    // Helper methods for data processing
    getTopCategories(requests) {
        const categories = requests
            .map(req => req.primary_category)
            .filter(cat => cat && cat !== 'undefined');

        const categoryCounts = {};
        categories.forEach(cat => {
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });

        return Object.keys(categoryCounts)
            .sort((a, b) => categoryCounts[b] - categoryCounts[a])
            .slice(0, 5);
    }

    getCommonTags(requests) {
        const capabilities = requests
            .map(req => req.capability)
            .filter(cap => cap && cap !== 'undefined');

        const capabilityCounts = {};
        capabilities.forEach(cap => {
            capabilityCounts[cap] = (capabilityCounts[cap] || 0) + 1;
        });

        return Object.entries(capabilityCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([tag, count]) => ({ tag, count }));
    }

    getSentimentDistribution(requests) {
        const descriptions = requests.map(req => req.description || '').join(' ').toLowerCase();

        return {
            positive: (descriptions.match(/\b(enhance|improve|optimize|streamline|accelerate)\b/g) || []).length,
            neutral: (descriptions.match(/\b(request|need|require|seek|guidance)\b/g) || []).length,
            negative: (descriptions.match(/\b(issue|problem|error|fail|concern)\b/g) || []).length
        };
    }

    // Method to start the backend server (for development)
    async startBackend() {
        console.log('🚀 Starting FastAPI backend...');
        console.log('Please run: cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload');
        console.log('Then refresh this page to use the parallel processing features.');
    }
}

// Create singleton instance
const fastapiService = new FastAPIService();

export default fastapiService;
