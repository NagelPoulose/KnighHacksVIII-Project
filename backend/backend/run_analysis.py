#!/usr/bin/env python3
"""
Script to run the parallel accelerator analysis
"""
import asyncio
import json
import sys
import os
from datetime import datetime
from data_loader import DataLoader
from main import ParallelAcceleratorAgent, ResultConsolidator

async def run_parallel_analysis():
    """Run the complete parallel analysis"""
    print("🚀 Starting ServiceNow Accelerator Parallel Analysis")
    print("=" * 60)
    
    try:
        # Load data
        print("📊 Loading data...")
        loader = DataLoader()
        requests = loader.load_customer_requests()
        accelerators = loader.load_accelerators()
        
        print(f"✅ Loaded {len(requests)} customer requests")
        print(f"✅ Loaded {len(accelerators)} accelerators")
        
        # Split requests into 5 sections
        print("\n🔀 Splitting data into 5 sections...")
        sections = loader.split_requests_into_sections(requests)
        
        for i, section in enumerate(sections):
            print(f"  Section {i+1}: {len(section)} requests")
        
        # Create agents for each section
        print("\n🤖 Creating parallel agents...")
        agents = [ParallelAcceleratorAgent(i + 1) for i in range(5)]
        
        # Run analysis in parallel
        print("\n⚡ Running parallel analysis...")
        start_time = datetime.now()
        
        tasks = [
            agent.analyze_section(section, accelerators) 
            for agent, section in zip(agents, sections)
        ]
        
        # Wait for all tasks to complete
        section_results = await asyncio.gather(*tasks)
        
        total_time = (datetime.now() - start_time).total_seconds()
        
        print(f"\n✅ Parallel analysis completed in {total_time:.2f} seconds")
        
        # Display section results
        print("\n📋 Section Results:")
        for result in section_results:
            print(f"  Section {result.section_id}:")
            print(f"    - Processing time: {result.processing_time:.2f}s")
            print(f"    - Data points: {result.data_points_analyzed}")
            print(f"    - Confidence: {result.overall_confidence:.1f}%")
            print(f"    - Emerging needs: {len(result.emerging_needs)}")
            print(f"    - Patterns: {len(result.patterns)}")
            print(f"    - Trends: {len(result.trends)}")
            print(f"    - Gaps: {len(result.gaps)}")
            print(f"    - Recommendations: {len(result.recommendations)}")
        
        # Consolidate results
        print("\n🔄 Consolidating results...")
        consolidator = ResultConsolidator()
        consolidated_analysis = consolidator.consolidate_results(section_results)
        
        print(f"✅ Consolidation complete")
        print(f"  - Overall confidence: {consolidated_analysis['overallConfidence']:.1f}%")
        print(f"  - Total processing time: {consolidated_analysis['totalProcessingTime']:.2f}s")
        print(f"  - Total data points: {consolidated_analysis['totalDataPoints']}")
        print(f"  - Sections processed: {consolidated_analysis['sectionsProcessed']}")
        
        # Save results
        print("\n💾 Saving results...")
        results = {
            "consolidated_analysis": consolidated_analysis,
            "section_results": [
                {
                    "section_id": result.section_id,
                    "emerging_needs": result.emerging_needs,
                    "patterns": result.patterns,
                    "trends": result.trends,
                    "gaps": result.gaps,
                    "recommendations": result.recommendations,
                    "overall_confidence": result.overall_confidence,
                    "processing_time": result.processing_time,
                    "data_points_analyzed": result.data_points_analyzed,
                    "timestamp": result.timestamp
                } for result in section_results
            ],
            "metadata": {
                "total_requests": len(requests),
                "total_accelerators": len(accelerators),
                "analysis_timestamp": datetime.now().isoformat(),
                "total_analysis_time": total_time
            }
        }
        
        # Save to file
        output_file = f"analysis_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"✅ Results saved to {output_file}")
        
        # Display top recommendations
        print("\n🎯 Top Recommendations:")
        for i, rec in enumerate(consolidated_analysis['recommendations'][:5], 1):
            print(f"  {i}. {rec.get('recommendation', 'N/A')}")
            print(f"     Priority: {rec.get('priority', 'N/A')}")
            print(f"     Confidence: {rec.get('confidence', 0):.1f}%")
            print(f"     Impact: {rec.get('expectedImpact', 'N/A')}")
            print()
        
        print("🎉 Analysis complete!")
        return results
        
    except Exception as e:
        print(f"❌ Error during analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def main():
    """Main function"""
    if len(sys.argv) > 1 and sys.argv[1] == "--help":
        print("ServiceNow Accelerator Parallel Analysis")
        print("Usage: python run_analysis.py")
        print("This script will:")
        print("  1. Load customer requests and accelerators from CSV files")
        print("  2. Split requests into 5 sections")
        print("  3. Run parallel AI analysis on each section")
        print("  4. Consolidate results")
        print("  5. Save results to JSON file")
        return
    
    # Run the analysis
    results = asyncio.run(run_parallel_analysis())
    
    if results:
        print(f"\n📊 Analysis Summary:")
        print(f"  - Total requests analyzed: {results['metadata']['total_requests']}")
        print(f"  - Total accelerators: {results['metadata']['total_accelerators']}")
        print(f"  - Analysis time: {results['metadata']['total_analysis_time']:.2f}s")
        print(f"  - Overall confidence: {results['consolidated_analysis']['overallConfidence']:.1f}%")
    else:
        print("❌ Analysis failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
