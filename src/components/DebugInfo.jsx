import React from 'react';

const DebugInfo = ({ data, patternAnalysis, recommendations, isLoading }) => {
    return (
        <div className="glass-effect rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Debug Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                    <h4 className="font-medium text-gray-300 mb-2">Data Status</h4>
                    <p className="text-gray-400">Data loaded: {data ? '✅ Yes' : '❌ No'}</p>
                    <p className="text-gray-400">Requests: {data?.requests?.length || 0}</p>
                    <p className="text-gray-400">Accelerators: {data?.accelerators?.length || 0}</p>
                </div>

                <div>
                    <h4 className="font-medium text-gray-300 mb-2">Analysis Status</h4>
                    <p className="text-gray-400">Pattern Analysis: {patternAnalysis ? '✅ Done' : '❌ Not run'}</p>
                    <p className="text-gray-400">Recommendations: {recommendations ? '✅ Done' : '❌ Not generated'}</p>
                    <p className="text-gray-400">Loading: {isLoading ? '⏳ Yes' : '✅ No'}</p>
                </div>

                {patternAnalysis && (
                    <div className="md:col-span-2">
                        <h4 className="font-medium text-gray-300 mb-2">Pattern Analysis Results</h4>
                        <div className="bg-black/20 rounded p-3 text-xs text-gray-300 max-h-32 overflow-y-auto">
                            <pre>{JSON.stringify(patternAnalysis, null, 2)}</pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DebugInfo;
