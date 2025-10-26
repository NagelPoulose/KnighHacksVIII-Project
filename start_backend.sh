#!/bin/bash

echo "🚀 Starting ServiceNow Accelerator AI Backend"
echo "=============================================="

# Navigate to backend directory
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run setup first."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env.example .env
    echo "📝 Please edit backend/.env and add your GOOGLE_API_KEY"
    echo "   Then run this script again."
    exit 1
fi

# Start the FastAPI server
echo "🚀 Starting FastAPI server on http://localhost:8000"
echo "📚 API documentation available at http://localhost:8000/docs"
echo "🔄 Press Ctrl+C to stop the server"
echo ""

./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload