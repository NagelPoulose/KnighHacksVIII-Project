#!/usr/bin/env python3
"""
Simple test script to verify the FastAPI backend is working
"""
import requests
import json

def test_backend():
    """Test the FastAPI backend endpoints"""
    base_url = "http://localhost:8000"
    
    print("🧪 Testing ServiceNow Accelerator AI Backend")
    print("=" * 50)
    
    # Test 1: Health check
    try:
        response = requests.get(f"{base_url}/")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False
    
    # Test 2: Status endpoint
    try:
        response = requests.get(f"{base_url}/status")
        if response.status_code == 200:
            print("✅ Status endpoint working")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Status endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Status endpoint failed: {e}")
    
    # Test 3: Parallel analysis with sample data
    try:
        sample_data = {
            "requests": [
                {
                    "number": "TEST001",
                    "capability": "Test Capability",
                    "company": "Test Company",
                    "description": "Test description for analysis",
                    "initiative_title": "Test Initiative",
                    "primary_category": "Test Category"
                }
            ],
            "accelerators": [
                {
                    "name": "Test Accelerator",
                    "description": "Test accelerator description"
                }
            ]
        }
        
        print("\n🚀 Testing parallel analysis...")
        response = requests.post(f"{base_url}/analyze-parallel", json=sample_data)
        
        if response.status_code == 200:
            print("✅ Parallel analysis endpoint working")
            result = response.json()
            print(f"   Status: {result.get('status')}")
            print(f"   Message: {result.get('message')}")
        else:
            print(f"❌ Parallel analysis failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Parallel analysis failed: {e}")
    
    print("\n🎉 Backend test completed!")
    return True

if __name__ == "__main__":
    test_backend()

