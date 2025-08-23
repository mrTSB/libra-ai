# Libra AI Orchestrator 🤖 (LLM-Powered)

A **smart, AI-powered routing API** that uses an LLM agent to intelligently analyze user queries and direct them to the most appropriate specialized AI agent. The orchestrator serves as a central hub for the Libra AI ecosystem, using Claude Sonnet 3.5 to understand context and intent beyond simple keyword matching.

## 🧠 How It Works

Instead of basic keyword matching, the orchestrator uses **Claude Sonnet 3.5** to:

1. **Analyze query content and intent** - Understand what the user actually needs
2. **Consider context and nuance** - Handle ambiguous or complex queries intelligently  
3. **Make informed routing decisions** - Choose the best agent based on deep understanding
4. **Provide detailed reasoning** - Explain why each agent was selected
5. **Graceful fallback** - Default to Lexi when uncertain, ensuring users always get help

## 🏗️ Architecture

The orchestrator uses LLM-based intelligent analysis to route queries:

- **Lexi** (Default): Legal questions, constitutional rights, contract law, legal advice
- **Juris**: Patent searches, prior art, intellectual property, innovation research  
- **Filora**: Web automation, form filling, browser actions, task execution

## 🔧 Features

- **🤖 LLM-Powered Routing**: Claude Sonnet 3.5 analyzes queries for optimal agent selection
- **🧠 Intelligent Analysis**: Context-aware understanding beyond simple keywords
- **💭 Detailed Reasoning**: LLM explains routing decisions with clear logic
- **🔄 Graceful Fallback**: Defaults to Lexi when uncertain, ensuring users always get help
- **🔧 Dynamic Filora Actions**: LLM analysis determines best automation action type
- **📊 Enhanced Responses**: Detailed action analysis and reasoning for complex queries
- **⚡ Async Performance**: Fast, non-blocking agent communication
- **🛡️ Robust Error Handling**: Comprehensive error handling and timeout management
- **📈 Performance Metrics**: Execution time tracking and success monitoring
- **🌐 CORS Ready**: Configured for web frontend integration

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend/orchestrator
uv sync  # Using uv as preferred package manager
```

### 2. Set Environment Variables

```bash
# Copy environment template
cp orchestrator.env.example .env

# Edit .env with your API keys:
# - ANTHROPIC_API_KEY (for Claude Sonnet 3.5 routing)
# - LEXI_BACKEND_URL (optional - defaults to localhost:8000)
# - JURIS_BACKEND_URL (optional - defaults to localhost:8001)
# - FILORA_BACKEND_URL (optional - defaults to localhost:8000)
```

### 3. Start the Orchestrator

```bash
# Run directly
python orchestrator.py

# Or using the management script
python start_orchestrator.py start

# Or using uvicorn
uvicorn orchestrator:app --host 0.0.0.0 --port 8002 --reload
```

The API will be available at:
- **API**: http://localhost:8002
- **Documentation**: http://localhost:8002/docs
- **Health Check**: http://localhost:8002/health

### 4. Test the System

```bash
# Run comprehensive tests
python test_orchestrator.py

# Interactive testing mode
python test_orchestrator.py interactive

# Run the full demo
python orchestrator_demo.py
```

## 🔧 API Endpoints

### Main Orchestrator (LLM-Powered)
```
POST /orchestrator
```

**Request:**
```json
{
  "query": "I need help with both legal and patent questions",
  "user_id": "user123",
  "context": {"session": "consultation"}
}
```

**Response:**
```json
{
  "query": "I need help with both legal and patent questions",
  "selected_agent": "lexi",
  "agent_description": "Legal expert for law-related questions and legal advice...",
  "reasoning": "This query involves legal matters and the user needs general guidance. While it mentions patents, the primary need appears to be legal assistance, so Lexi is the most appropriate agent. Lexi can provide legal context and then refer to Juris for specific patent questions if needed.",
  "agent_response": {
    "agent_name": "Lexi",
    "agent_description": "Legal expert for law-related questions...",
    "input_query": "I need help with both legal and patent questions",
    "output_response": {
      "answer": "I can help you with the legal aspects...",
      "sources": [...],
      "local_context_used": [...]
    },
    "success": true,
    "error_message": null
  },
  "execution_time": 2.34
}
```

**Enhanced Filora Response (with Action Analysis):**
```json
{
  "query": "Fill out the contact form with my details",
  "selected_agent": "filora",
  "agent_description": "Action agent for web automation...",
  "reasoning": "This query involves form filling and data entry, which is a clear task for Filora's automation capabilities.",
  "agent_response": {
    "agent_name": "Filora",
    "agent_description": "Action agent for web automation...",
    "input_query": "Fill out the contact form with my details",
    "output_response": {
      "result": {...},
      "filora_action_analysis": {
        "action_type": "fill-form",
        "endpoint": "/fill-form",
        "reasoning": "The user wants to fill out a contact form, which requires form filling automation. This is best handled by the /fill-form endpoint."
      }
    },
    "success": true,
    "error_message": null
  },
  "execution_time": 1.87
}
```

### Direct Agent Queries
```
POST /orchestrator/lexi      # Direct to Lexi
POST /orchestrator/juris     # Direct to Juris  
POST /orchestrator/filora    # Direct to Filora
```

### Information Endpoints
```
GET /                    # Health check and system info
GET /health             # Health status
GET /agents             # List all agents and capabilities
```

## 🧠 LLM Routing Logic

The orchestrator uses Claude Sonnet 3.5 to intelligently analyze each query:

### Lexi (Legal Agent)
**Specialties:** constitutional law, civil rights, contract law, criminal law, employment law, family law, property law, legal procedures, compliance, regulations, legal advice, court procedures

**Example Queries:**
- "What are my constitutional rights?"
- "How do I file a lawsuit?"
- "Legal advice on employment contracts"
- "What are Miranda rights?"

### Juris (Patent Agent)  
**Specialties:** patent search, prior art, intellectual property, innovation research, patentability, technology research, invention analysis, IP protection

**Example Queries:**
- "Search for patents related to machine learning"
- "Find prior art for my invention"
- "Check patentability of my software idea"
- "What patents exist for quantum computing?"

### Filora (Action Agent)
**Specialties:** web automation, form filling, browser actions, data extraction, task execution, website interaction, application automation

**Dynamic Action Analysis:** Filora now uses LLM analysis to intelligently determine the best action type for each query, choosing from:
- **/fill-form** - Form filling, data entry, completing applications
- **/click-element** - Clicking buttons, links, or specific elements  
- **/extract-data** - Extracting information from web pages
- **/action** - General automation tasks, navigation, or complex workflows

**Example Queries:**
- "Fill out this form for me"
- "Click the submit button on the website"
- "Automate this web task"
- "Extract data from this page"
- "Complete this online application for me"
- "Get the price information from this product page"
- "Click on the first search result"
- "Extract all the links from this webpage"

### Complex/Ambiguous Queries
**LLM Analysis:** The AI analyzes intent, context, and nuance to make intelligent decisions

**Example Queries:**
- "I need help with both legal and patent questions"
- "Can you help me understand what kind of assistance I need?"
- "I'm confused about whether this is a legal question or something else"

**Default Behavior:** If the LLM is uncertain or the query is ambiguous, it defaults to **Lexi** for general assistance.

## ⚙️ Configuration

### Environment Variables

```bash
# Required: LLM API Key
ANTHROPIC_API_KEY=your-claude-api-key

# Agent backend URLs (optional - defaults to localhost)
LEXI_BACKEND_URL=http://localhost:8000
JURIS_BACKEND_URL=http://localhost:8001  
FILORA_BACKEND_URL=http://localhost:8000

# Orchestrator settings
ORCHESTRATOR_PORT=8002
ORCHESTRATOR_HOST=0.0.0.0

# Logging Configuration
LOG_LEVEL=INFO
# LOG_LEVEL=DEBUG  # Uncomment for detailed logging
```

### Agent Configuration

The agent configurations are defined in `orchestrator.py` and can be customized:

```python
AGENT_CONFIGS = {
    "lexi": {
        "name": "Lexi",
        "description": "Legal expert for law-related questions...",
        "base_url": "http://localhost:8000",
        "endpoint": "/legal/chat",
        "specialties": ["constitutional law", "civil rights", ...]
    },
    # ... other agents
}
```

## 🔍 Testing

### Automated Tests
```bash
python test_orchestrator.py
```

Tests include:
- Health checks
- Agent listing
- LLM-powered query routing
- Direct agent queries
- Error handling
- Complex query analysis

### Interactive Testing
```bash
python test_orchestrator.py interactive
```

Test queries in real-time and see how the LLM analyzes and routes them.

### Full Demo
```bash
python orchestrator_demo.py
```

Comprehensive demonstration of LLM routing capabilities.

### Manual Testing with curl

```bash
# Test the LLM-powered orchestrator
curl -X POST "http://localhost:8002/orchestrator" \
  -H "Content-Type: application/json" \
  -d '{"query": "I need help with both legal and patent questions"}'

# Test direct routing to Lexi
curl -X POST "http://localhost:8002/orchestrator/lexi" \
  -H "Content-Type: application/json" \
  -d '{"query": "Legal advice on contracts"}'

# Check available agents
curl "http://localhost:8002/agents"
```

## 🏃‍♂️ Running in Production

### Using uvicorn
```bash
uvicorn orchestrator:app --host 0.0.0.0 --port 8002 --workers 4
```

### Using Gunicorn
```bash
gunicorn orchestrator:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8002
```

### Using the Management Script
```bash
# Start
python start_orchestrator.py start

# Start with auto-reload
python start_orchestrator.py start -r

# Check status
python start_orchestrator.py status

# Stop
python start_orchestrator.py stop
```

## 🔗 Integration Examples

### Python Client
```python
import requests

def ask_orchestrator(query: str):
    response = requests.post(
        "http://localhost:8002/orchestrator",
        json={"query": query}
    )
    return response.json()

# Example usage
result = ask_orchestrator("I need help with both legal and patent questions")
print(f"Selected agent: {result['selected_agent']}")
print(f"LLM reasoning: {result['reasoning']}")
print(f"Response: {result['agent_response']['output_response']}")
```

### JavaScript/Node.js
```javascript
async function askOrchestrator(query) {
  const response = await fetch('http://localhost:8002/orchestrator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  
  return await response.json();
}

// Example usage
const result = await askOrchestrator("Search for AI patents");
console.log(`Selected agent: ${result.selected_agent}`);
console.log(`LLM reasoning: ${result.reasoning}`);
```

## 🐛 Troubleshooting

### Common Issues

1. **Missing ANTHROPIC_API_KEY**
   - Ensure you have a valid Claude API key
   - Check that the environment variable is set correctly

2. **Agent Backend Not Running**
   - Ensure Lexi, Juris, and Filora are running on their respective ports
   - Check agent health endpoints

3. **LLM Routing Failures**
   - Check Claude API quota and limits
   - Verify network connectivity to Anthropic
   - Review logs for specific error messages

4. **Timeout Errors**
   - Increase timeout values in the orchestrator
   - Check network connectivity between services

### Debug Mode
Enable debug logging by modifying the logging level in `orchestrator.py`:

```python
logging.basicConfig(level=logging.DEBUG)
```

## 📚 API Documentation

Full interactive API documentation is available at:
- **Swagger UI**: http://localhost:8002/docs
- **ReDoc**: http://localhost:8002/redoc

## 🤝 Contributing

To add new agents or modify routing logic:

1. Add agent configuration to `AGENT_CONFIGS`
2. Update the `query_agent` method in `OrchestratorService`
3. Add appropriate specialties for LLM analysis
4. Update the LLM system prompt in `LLMRouter`
5. Update tests and documentation

## 🆕 What's New in v2.0

- **🤖 LLM-Powered Routing**: Replaced keyword matching with Claude Sonnet 3.5
- **🧠 Intelligent Analysis**: Context-aware query understanding
- **💭 Detailed Reasoning**: LLM explains routing decisions
- **🔄 Graceful Fallback**: Smart defaults when uncertain
- **📁 Better Organization**: Moved to dedicated orchestrator folder
- **🔧 Enhanced Testing**: Comprehensive test suite for LLM routing

## 📄 License

This project is part of the Libra AI ecosystem.
