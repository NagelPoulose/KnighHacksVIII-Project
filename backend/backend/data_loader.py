import pandas as pd
import json
from typing import List, Dict, Any
import os

class DataLoader:
    def __init__(self, data_dir: str = "../csv"):
        self.data_dir = data_dir
    
    def load_customer_requests(self) -> List[Dict[str, Any]]:
        """Load customer requests from CSV"""
        csv_path = os.path.join(self.data_dir, "u_hack.csv")
        
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"Customer requests CSV not found at {csv_path}")
        
        df = pd.read_csv(csv_path)
        
        # Convert to list of dictionaries
        requests = []
        for _, row in df.iterrows():
            requests.append({
                "number": str(row.get("number", "")),
                "capability": str(row.get("capability", "")),
                "company": str(row.get("company", "")),
                "description": str(row.get("description", "")),
                "initiative_title": str(row.get("initiative_title", "")),
                "primary_category": str(row.get("primary_category", ""))
            })
        
        return requests
    
    def load_accelerators(self) -> List[Dict[str, Any]]:
        """Load accelerators from CSV"""
        csv_path = os.path.join(self.data_dir, "accelerators.csv")
        
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"Accelerators CSV not found at {csv_path}")
        
        df = pd.read_csv(csv_path)
        
        # Convert to list of dictionaries
        accelerators = []
        for _, row in df.iterrows():
            accelerators.append({
                "name": str(row.get("name", "")),
                "description": str(row.get("description", ""))
            })
        
        return accelerators
    
    def split_requests_into_sections(self, requests: List[Dict[str, Any]], num_sections: int = 5) -> List[List[Dict[str, Any]]]:
        """Split requests into equal sections for parallel processing"""
        section_size = len(requests) // num_sections
        sections = []
        
        for i in range(num_sections):
            start_idx = i * section_size
            end_idx = start_idx + section_size if i < num_sections - 1 else len(requests)
            sections.append(requests[start_idx:end_idx])
        
        return sections
    
    def get_data_summary(self, requests: List[Dict[str, Any]], accelerators: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Get summary statistics of the data"""
        return {
            "total_requests": len(requests),
            "total_accelerators": len(accelerators),
            "unique_companies": len(set(req["company"] for req in requests)),
            "unique_capabilities": len(set(req["capability"] for req in requests)),
            "unique_categories": len(set(req["primary_category"] for req in requests)),
            "avg_description_length": sum(len(req["description"]) for req in requests) / len(requests) if requests else 0
        }

# Example usage and testing
if __name__ == "__main__":
    loader = DataLoader()
    
    try:
        # Load data
        requests = loader.load_customer_requests()
        accelerators = loader.load_accelerators()
        
        print(f"Loaded {len(requests)} customer requests")
        print(f"Loaded {len(accelerators)} accelerators")
        
        # Get summary
        summary = loader.get_data_summary(requests, accelerators)
        print(f"Data Summary: {json.dumps(summary, indent=2)}")
        
        # Split into sections
        sections = loader.split_requests_into_sections(requests)
        print(f"Split into {len(sections)} sections:")
        for i, section in enumerate(sections):
            print(f"  Section {i+1}: {len(section)} requests")
        
    except Exception as e:
        print(f"Error: {e}")
