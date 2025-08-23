# libra-ai

hacking
tanvir dont push the .env
AI agent system with Convex database for storing and managing agent runs.

## 🎯 Overview

Libra AI is a multi-agent system that stores and manages agent run data using Convex as the backend database. The system supports 6 agents (numbered 1-6) and provides a robust Python interface for interacting with agent runs.

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   pip install -r requirements.txt
   ```

2. **Set up Convex**:
   ```bash
   npx convex dev
   ```

3. **Configure environment**:
   ```bash
   cp env.example .env
   # Update CONVEX_URL in .env with your deployment URL
   ```

4. **Test the setup**:
   ```bash
   python example_usage.py
   ```

5. **🆕 Start the AI Agent Orchestrator (LLM-Powered)**:
   ```bash
   # Navigate to orchestrator folder
   cd orchestrator
   
   # Start the orchestrator
   python start_orchestrator.py start
   
   # Test the orchestrator
   python test_orchestrator.py
   
   # Or test interactively
   python test_orchestrator.py interactive
   
   # Run the full demo
   python orchestrator_demo.py
   ```

## 📁 Project Structure

```
libra-ai/
├── convex/                 # Convex backend functions
│   ├── schema.ts          # Database schema
│   └── agentRuns.ts       # Agent runs functions
├── orchestrator/           # 🆕 AI Agent Orchestrator (LLM-Powered)
│   ├── orchestrator.py     # Main orchestrator API
│   ├── start_orchestrator.py # Management script
│   ├── test_orchestrator.py  # Testing suite
│   └── orchestrator_demo.py  # Interactive demo
├── lexi/                   # Legal AI Agent
├── juris/                  # Patent Search Agent  
├── filora/                 # Action/Automation Agent
├── sage/                   # Sage Agent
├── donna/                  # Donna Agent
├── convex_client.py        # Python client for Convex
├── example_usage.py        # Usage examples
├── requirements.txt        # Python dependencies
├── package.json           # Node.js dependencies
├── SETUP.md               # Detailed setup guide
└── README.md              # This file
```

## 🔧 Features

- **Multi-agent support**: Store runs for 6 different agents
- **JSON data storage**: Flexible storage for any run data structure
- **Python integration**: Easy-to-use Python client
- **Real-time sync**: Convex provides real-time updates
- **Type safety**: TypeScript backend with proper validation
- **🆕 AI Agent Orchestrator**: LLM-powered intelligent routing to specialized agents
- **🆕 Legal AI (Lexi)**: Expert legal advice and document analysis
- **🆕 Patent Search (Juris)**: Prior art and patent research
- **🆕 Action Agent (Filora)**: Web automation and task execution

## 📖 Documentation

- [Complete Setup Guide](SETUP.md) - Detailed setup instructions
- [Convex Documentation](https://docs.convex.dev/) - Official Convex docs
- [🆕 Orchestrator Guide](ORCHESTRATOR_README.md) - AI Agent Orchestrator setup and usage

## 🤝 Usage Examples

### Convex Client
```python
from convex_client import ConvexAgentClient

def main():
    client = ConvexAgentClient()
    
    # Add a run to agent 1
    run_data = {
        "task": "Data analysis",
        "status": "completed",
        "timestamp": "2025-01-30T10:30:00Z"
    }
    client.add_run_to_agent(1, run_data)
    
    # Get all runs for agent 1
    runs = client.get_runs_by_agent(1)
    print(f"Agent 1 has {len(runs)} runs")

main()
```

### 🆕 AI Agent Orchestrator (LLM-Powered)
```python
import requests

def ask_orchestrator(query: str):
    response = requests.post(
        "http://localhost:8002/orchestrator",
        json={"query": query}
    )
    return response.json()

# Example: Legal question (routes to Lexi)
result = ask_orchestrator("What are my constitutional rights?")
print(f"Selected agent: {result['selected_agent']}")
print(f"LLM reasoning: {result['reasoning']}")

# Example: Patent search (routes to Juris)
result = ask_orchestrator("Search for AI patents")
print(f"Selected agent: {result['selected_agent']}")
print(f"LLM reasoning: {result['reasoning']}")

# Example: Complex query (LLM analysis)
result = ask_orchestrator("I need help with both legal and patent questions")
print(f"Selected agent: {result['selected_agent']}")
print(f"LLM reasoning: {result['reasoning']}")
```

## 🛠️ Development

For detailed development setup and troubleshooting, see [SETUP.md](SETUP.md).

## 📄 License

MIT License
