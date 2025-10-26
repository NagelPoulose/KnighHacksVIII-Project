# ServiceNow AI Accelerator Hub

A sophisticated AI-powered platform for analyzing customer needs and recommending new ServiceNow accelerators. Built for the ServiceNow hackathon with two specialized AI agents and a beautiful React interface.

## 🚀 Features

### Two Specialized AI Agents

1. **Pattern Analysis Agent** - Identifies emerging customer needs and patterns
2. **Accelerator Recommendation Agent** - Recommends new accelerators based on analysis

### Beautiful Dashboard
- Modern React UI with Tailwind CSS
- Interactive charts and visualizations
- Real-time analytics
- Responsive design

### AI-Powered Insights
- Customer sentiment analysis
- Request categorization and trending
- Gap analysis in current offerings
- Priority-based recommendations

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Charts**: Recharts
- **Animations**: Framer Motion
- **AI**: Google Gemini API
- **Data Processing**: Papa Parse
- **Backend**: Express.js

## 📦 Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Development Server**
   ```bash
   npm run dev
   ```

3. **Production Build**
   ```bash
   npm run build
   npm start
   ```

## 🔧 Configuration

### Environment Variables

1. **Copy the environment template**
   ```bash
   cp .env.example .env
   ```

2. **Get your Google AI API key**
   - Visit: https://aistudio.google.com/app/apikey
   - Create a new API key
   - Copy the key

3. **Add your API key to .env**
   ```bash
   VITE_GOOGLE_API_KEY=your_actual_api_key_here
   ```

### Security Note
- Never commit your `.env` file to version control
- The `.env` file is already in `.gitignore`
- Use `.env.example` as a template for others

## 📊 Data Sources

- `csv/accelerators.csv` - Existing ServiceNow accelerators
- `csv/u_hack.csv` - Customer hackathon data

## 🎯 Usage

1. **Dashboard** - Overview of analytics and metrics
2. **Customer Requests** - Browse and review individual A2E requests
   - Filter by review status, match quality, category
   - Click any request for detailed analysis
   - Mark requests as reviewed
3. **Gap Analysis** - Identify requests that can't be fulfilled
   - Visual breakdown of matched vs unmatched requests
   - See critical gaps in your accelerator catalog
4. **Recommendations** - AI-suggested new accelerators based on gaps
   - Recommendations tied to actual unmet customer needs
   - Business justification and implementation guidance
5. **Analytics** - Detailed insights and visualizations

## 🔄 How It Works

1. **Data Loading**: Automatically loads accelerators and A2E requests from CSV files
2. **AI Matching**: Uses Google Gemini AI to match each request to existing accelerators
3. **Confidence Scoring**: Assigns confidence scores (0-100) to each match
4. **Gap Identification**: Identifies requests that CAN'T be fulfilled by existing accelerators
5. **Smart Recommendations**: AI suggests NEW accelerators to fill those gaps
6. **Review Workflow**: Track which requests have been analyzed

## ✨ New Features (Joseph Branch)

- **Request-by-Request Analysis**: View each customer request individually
- **AI Matching Engine**: Intelligent pairing of requests to accelerators
- **Confidence Metrics**: Quantified match quality for every request
- **Review System**: Mark requests as reviewed/to review
- **Gap Analysis Dashboard**: Visual identification of unmet needs
- **Gap-Driven Recommendations**: New accelerators based on actual gaps

## 🏆 Hackathon Features

### Judging Criteria Alignment

1. **Accuracy and Relevance** ✅
   - Advanced pattern recognition
   - Contextual analysis of customer requests
   - Relevant accelerator matching

2. **Predictive Capability** ✅
   - AI-powered trend analysis
   - Future need prediction
   - Strategic accelerator recommendations

### Technical Requirements

1. **State-of-the-art Techniques** ✅
   - Google Gemini AI integration
   - Advanced data processing
   - Machine learning insights

2. **Scalability** ✅
   - Efficient data handling
   - Optimized API calls
   - Responsive architecture

## 🎨 UI/UX Features

- **Glass morphism design**
- **Gradient backgrounds**
- **Smooth animations**
- **Interactive charts**
- **Responsive layout**
- **Dark theme**

## 📈 Analytics Dashboard

- Request volume trends
- Category distribution
- Sentiment analysis
- Complexity assessment
- Priority tracking
- Tag frequency analysis

## 🤖 AI Agents

### Pattern Analysis Agent
- Analyzes customer request patterns
- Identifies emerging needs
- Provides trend insights
- Gap analysis

### Accelerator Recommendation Agent
- Generates strategic recommendations
- Business justification
- Implementation complexity
- Customer impact assessment

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development: `npm run dev`
4. Open http://localhost:3000

## 📝 License

Built for ServiceNow Hackathon 2024
=======
# KnighHacksVIII-Project
>>>>>>> ea69c539df65231a82142c630d42b59f370949d3
