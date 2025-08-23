#!/usr/bin/env python3
"""
Example usage of the Convex client for libra-ai agent runs storage.
This script demonstrates how to store and retrieve agent run data.
"""

import json
from datetime import datetime
from convex_client import ConvexAgentClient, add_agent_run, get_agent_runs, get_agents_stats

def main():
    """
    Example usage of the Convex client.
    """
    print("🚀 Libra AI - Convex Agent Runs Example")
    print("=" * 50)
    
    # Initialize client (make sure to set CONVEX_URL in your .env file)
    try:
        client = ConvexAgentClient()
        print("✅ Successfully connected to Convex")
    except ValueError as e:
        print(f"❌ Error: {e}")
        print("Please make sure you have:")
        print("1. Deployed your Convex functions: npx convex deploy")
        print("2. Set CONVEX_URL in your .env file")
        return
    
    # Example run data for different agents
    example_runs = {
        1: {
            "task": "Data analysis",
            "status": "completed",
            "timestamp": datetime.now().isoformat(),
            "metrics": {"accuracy": 0.95, "processing_time": 123.45},
            "output": "Analysis complete: Found 5 key insights"
        },
        2: {
            "task": "Model training",
            "status": "in_progress",
            "timestamp": datetime.now().isoformat(),
            "metrics": {"epochs": 10, "loss": 0.23},
            "output": "Training epoch 10/50 completed"
        },
        3: {
            "task": "Data preprocessing",
            "status": "completed",
            "timestamp": datetime.now().isoformat(),
            "metrics": {"rows_processed": 10000, "cleaning_time": 45.2},
            "output": "Preprocessed 10k rows, removed 150 outliers"
        }
    }
    
    print("\n📝 Adding example runs for agents 1, 2, and 3...")
    
    # Add runs for different agents
    for agent_num, run_data in example_runs.items():
        try:
            doc_id = client.add_run_to_agent(agent_num, run_data)
            print(f"✅ Added run for Agent {agent_num} (ID: {doc_id[:8]}...)")
        except Exception as e:
            print(f"❌ Error adding run for Agent {agent_num}: {e}")
    
    print("\n📊 Retrieving all agents statistics...")
    
    # Get all agents stats
    try:
        stats = client.get_all_agents_stats()
        if stats:
            for stat in stats:
                print(f"🤖 Agent {stat['agentNumber']}: {stat['runCount']} runs (last updated: {stat['lastUpdated']})")
        else:
            print("No agents found")
    except Exception as e:
        print(f"❌ Error getting stats: {e}")
    
    print("\n🔍 Retrieving runs for Agent 1...")
    
    # Get runs for a specific agent
    try:
        agent_1_runs = client.get_runs_by_agent(1)
        if agent_1_runs:
            print(f"📋 Found {len(agent_1_runs)} runs for Agent 1:")
            for i, run in enumerate(agent_1_runs[-3:], 1):  # Show last 3 runs
                print(f"  {i}. {run.get('task', 'Unknown task')} - {run.get('status', 'Unknown status')}")
        else:
            print("No runs found for Agent 1")
    except Exception as e:
        print(f"❌ Error getting runs for Agent 1: {e}")
    
    print("\n🎯 Getting latest run for Agent 2...")
    
    # Get latest run for a specific agent
    try:
        latest_run = client.get_latest_run_by_agent(2)
        if latest_run:
            print(f"📄 Latest run for Agent 2:")
            print(f"   Task: {latest_run.get('task', 'Unknown')}")
            print(f"   Status: {latest_run.get('status', 'Unknown')}")
            print(f"   Output: {latest_run.get('output', 'No output')}")
        else:
            print("No runs found for Agent 2")
    except Exception as e:
        print(f"❌ Error getting latest run for Agent 2: {e}")
    
    print("\n🔄 Testing convenience functions...")
    
    # Test convenience functions
    try:
        # Add a run using convenience function
        convenience_run = {
            "task": "Testing convenience function",
            "status": "completed",
            "timestamp": datetime.now().isoformat(),
            "test": True
        }
        
        add_agent_run(4, convenience_run)
        print("✅ Added run using convenience function")
        
        # Get runs using convenience function
        agent_4_runs = get_agent_runs(4)
        print(f"📋 Agent 4 has {len(agent_4_runs)} runs")
        
    except Exception as e:
        print(f"❌ Error with convenience functions: {e}")
    
    print("\n🎉 Example completed successfully!")
    print("\nNext steps:")
    print("1. Modify this script to suit your specific use case")
    print("2. Integrate the ConvexAgentClient into your main application")
    print("3. Use the client to store and retrieve agent run data")

if __name__ == "__main__":
    # Run the example
    main()
