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

## 📁 Project Structure

```
libra-ai/
├── convex/                 # Convex backend functions
│   ├── schema.ts          # Database schema
│   └── agentRuns.ts       # Agent runs functions
├── convex_client.py       # Python client for Convex
├── example_usage.py       # Usage examples
├── requirements.txt       # Python dependencies
├── package.json          # Node.js dependencies
├── SETUP.md              # Detailed setup guide
└── README.md             # This file
```

## 🔧 Features

- **Multi-agent support**: Store runs for 6 different agents
- **JSON data storage**: Flexible storage for any run data structure
- **Python integration**: Easy-to-use Python client
- **Real-time sync**: Convex provides real-time updates
- **Type safety**: TypeScript backend with proper validation

## 📖 Documentation

- [Complete Setup Guide](SETUP.md) - Detailed setup instructions
- [Convex Documentation](https://docs.convex.dev/) - Official Convex docs

## 🤝 Usage Example

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

## 🛠️ Development

For detailed development setup and troubleshooting, see [SETUP.md](SETUP.md).

## 📄 License

MIT License
