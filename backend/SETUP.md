# Convex Database Setup Guide for Libra AI

This guide will walk you through setting up Convex database for storing agent runs data in your libra-ai project.

## 📋 Prerequisites

- Node.js (v18 or later)
- Python (v3.8 or later)
- npm or yarn package manager

## 🚀 Quick Start

### Step 1: Install Dependencies

**JavaScript/TypeScript dependencies:**
```bash
npm install
```

**Python dependencies:**
```bash
pip install -r requirements.txt
```

### Step 2: Initialize Convex

1. **Sign up for Convex** (if you haven't already):
   ```bash
   npx convex login
   ```

2. **Initialize your Convex project**:
   ```bash
   npx convex dev
   ```
   
   This will:
   - Create a new Convex project (if needed)
   - Deploy your schema and functions
   - Give you a deployment URL

3. **Copy your deployment URL** from the terminal output (something like `https://your-deployment-name.convex.cloud`)

### Step 3: Configure Environment

1. **Copy the environment template**:
   ```bash
   cp env.example .env
   ```

2. **Update `.env` with your Convex URL**:
   ```bash
   CONVEX_URL=https://your-actual-deployment-url.convex.cloud
   ```

### Step 4: Test the Setup

Run the example script to verify everything works:

```bash
python example_usage.py
```

You should see output showing successful connection and example data operations.

## 📊 Database Schema

The database stores agent runs with the following structure:

```typescript
agentRuns: {
  agentNumber: number,     // Agent ID (1-6)
  runs: any[],            // Array of JSON run data
  createdAt: number,      // Timestamp when record was created
  updatedAt: number       // Timestamp when record was last updated
}
```

## 🔧 Available Functions

### Mutations (Write Operations)
- `addRunToAgent(agentNumber, run)` - Add a run to an agent
- `clearAgentRuns(agentNumber)` - Clear all runs for an agent

### Queries (Read Operations)
- `getRunsByAgent(agentNumber)` - Get all runs for an agent
- `getLatestRunByAgent(agentNumber)` - Get the most recent run for an agent
- `getAllAgentsStats()` - Get statistics for all agents

## 🐍 Python Usage

### Basic Usage

```python
from convex_client import ConvexAgentClient

def main():
    # Initialize client
    client = ConvexAgentClient()
    
    # Add a run to agent 1
    run_data = {
        "task": "Data analysis",
        "status": "completed",
        "timestamp": "2025-01-30T10:30:00Z",
        "metrics": {"accuracy": 0.95}
    }
    client.add_run_to_agent(1, run_data)
    
    # Get all runs for agent 1
    runs = client.get_runs_by_agent(1)
    print(f"Agent 1 has {len(runs)} runs")

main()
```

### Convenience Functions

For simpler usage, you can use the convenience functions:

```python
from convex_client import add_agent_run, get_agent_runs

def simple_example():
    # Add a run
    add_agent_run(1, {"task": "example", "status": "done"})
    
    # Get runs
    runs = get_agent_runs(1)
    print(runs)

simple_example()
```

## 🔄 Development Workflow

### Making Schema Changes

1. **Edit the schema** in `convex/schema.ts`
2. **Update functions** in `convex/agentRuns.ts` if needed
3. **Deploy changes**:
   ```bash
   npx convex deploy
   ```

### Adding New Functions

1. **Add function** to `convex/agentRuns.ts`
2. **Deploy**:
   ```bash
   npx convex deploy
   ```
3. **Update Python client** in `convex_client.py` if needed

## 🛠️ Troubleshooting

### Common Issues

**1. "Convex URL not provided" error**
- Make sure you have a `.env` file with `CONVEX_URL` set
- Ensure the URL starts with `https://` and ends with `.convex.cloud`

**2. "Agent number must be between 1 and 6" error**
- The system is designed for agents 1-6 only
- Check your agent number parameter

**3. Connection errors**
- Verify your Convex deployment is active: `npx convex dashboard`
- Check your internet connection
- Ensure the Convex URL is correct

**4. Function not found errors**
- Make sure you've deployed your functions: `npx convex deploy`
- Check function names match exactly

### Debug Mode

To enable debug logging in Python:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📚 Next Steps

1. **Integrate into your main application** - Use the `ConvexAgentClient` class in your main libra-ai code
2. **Customize run data structure** - Modify the schema to match your specific needs
3. **Add authentication** - Implement user authentication for production use
4. **Monitor usage** - Use the Convex dashboard to monitor database usage

## 🔗 Useful Links

- [Convex Documentation](https://docs.convex.dev/)
- [Convex Python Client](https://github.com/get-convex/convex-py)
- [Convex Dashboard](https://dashboard.convex.dev/)

## 💡 Tips

- Use `getAllAgentsStats()` to monitor system activity
- Store timestamps in your run data for better tracking
- Consider adding metadata like run duration, success rate, etc.
- Use `clearAgentRuns()` for testing/reset scenarios
