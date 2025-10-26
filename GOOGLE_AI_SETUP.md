# Google AI SDK Setup Guide

This guide explains how to use the Google AI SDK (Gemini) JavaScript toolkit in this project.

## 🚀 Quick Start

### 1. Install the SDK

The SDK is already installed in this project:
```bash
npm install @google/generative-ai
```

### 2. Get Your API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 3. Set Up Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Add your API key to `.env`:
   ```env
   VITE_GOOGLE_API_KEY=your_actual_api_key_here
   ```

3. Restart the development server

## 📚 Usage Examples

### Basic Setup

```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the SDK
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Get a model instance
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
```

### Generate Content

```javascript
// Simple text generation
const result = await model.generateContent('Tell me a joke');
const response = await result.response;
const text = response.text();
console.log(text);
```

### Streaming Responses

```javascript
// Get streaming responses
const result = await model.generateContentStream('Explain quantum computing');

for await (const chunk of result.stream) {
  const chunkText = chunk.text();
  console.log(chunkText);
}
```

### Configuration Options

```javascript
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash',
  
  // Optional: Set generation config
  generationConfig: {
    temperature: 0.9,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
  },
  
  // Optional: Set safety settings
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
  ],
});
```

## 🎯 Available Models

- `gemini-2.5-flash` - Fast, efficient model (recommended)
- `gemini-2.0-flash-exp` - Latest experimental version
- `gemini-1.5-flash` - Previous generation flash model
- `gemini-1.5-pro` - More capable but slower model

## 📊 Usage in This Project

The SDK is used in `src/services/aiAgents.js`:

### PatternAnalysisAgent
- Analyzes customer data to identify emerging patterns
- Uses structured prompts for JSON output
- Handles parsing and error fallback

### AcceleratorRecommendationAgent
- Generates accelerator recommendations
- Takes pattern analysis as input
- Returns structured recommendations

### Example: Real-time Streaming Analysis

```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';

class PatternAnalysisAgent {
    async analyzePatternsStream(customerData, onUpdate) {
        const prompt = `Analyze this data: ${JSON.stringify(customerData)}`;
        
        const result = await this.model.generateContentStream(prompt);
        
        let fullText = '';
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullText += chunkText;
            
            // Call callback to update UI in real-time
            onUpdate(chunkText, fullText);
        }
        
        return this.parseResponse(fullText);
    }
}
```

## 🔧 Error Handling

```javascript
try {
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
} catch (error) {
  if (error.message.includes('API key')) {
    console.error('Invalid API key');
  } else if (error.message.includes('quota')) {
    console.error('API quota exceeded');
  } else {
    console.error('Error:', error);
  }
}
```

## 🔐 Security Best Practices

1. **Never commit your `.env` file** - It's already in `.gitignore`
2. **Use environment variables** - Never hardcode API keys
3. **Rate limiting** - Be aware of API rate limits
4. **Cost management** - Monitor your API usage in Google Cloud Console

## 🚨 Troubleshooting

### "API key is invalid"
- Check that your API key is correctly set in `.env`
- Verify the key in Google AI Studio
- Restart your dev server after changing `.env`

### "Model not found"
- Check the model name spelling
- Verify the model is available in your region

### Rate limit errors
- Add delays between requests
- Implement exponential backoff
- Consider upgrading your quota

## 📖 Additional Resources

- [Google AI SDK Documentation](https://ai.google.dev/docs)
- [Gemini API Reference](https://ai.google.dev/api)
- [Model Documentation](https://ai.google.dev/models/gemini)
- [Generative AI Studio](https://aistudio.google.com)

## 💰 Pricing

- Check current pricing: [Google AI Pricing](https://ai.google.dev/pricing)
- Gemini models have generous free tier for development
- Production use may require billing setup
