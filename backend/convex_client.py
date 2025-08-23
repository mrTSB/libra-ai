"""
Convex client configuration for libra-ai project.
Handles connection to Convex backend for agent runs storage.
"""

import os
import asyncio
from typing import Dict, List, Any, Optional
from convex import ConvexClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class ConvexAgentClient:
    """Client for interacting with Convex backend for agent runs storage."""
    
    def __init__(self, convex_url: Optional[str] = None):
        """
        Initialize the Convex client.
        
        Args:
            convex_url: Convex deployment URL. If not provided, will use CONVEX_URL env var.
        """
        self.convex_url = convex_url or os.getenv("CONVEX_URL")
        if not self.convex_url:
            raise ValueError(
                "Convex URL not provided. Either pass it as parameter or set CONVEX_URL environment variable."
            )
        
        self.client = ConvexClient(self.convex_url)
    
    def add_run_to_agent(self, agent_number: int, run_data: Dict[str, Any]) -> str:
        """
        Add a run to a specific agent.
        
        Args:
            agent_number: Agent number (1-6)
            run_data: JSON data for the run
            
        Returns:
            Document ID of the agent record
        """
        if not isinstance(agent_number, int) or agent_number < 1 or agent_number > 6:
            raise ValueError("Agent number must be an integer between 1 and 6")
        
        result = self.client.mutation("agentRuns:addRunToAgent", {
            "agentNumber": agent_number,
            "run": run_data
        })
        return result
    
    def get_runs_by_agent(self, agent_number: int) -> List[Dict[str, Any]]:
        """
        Get all runs for a specific agent.
        
        Args:
            agent_number: Agent number (1-6)
            
        Returns:
            List of run data for the agent
        """
        if not isinstance(agent_number, int) or agent_number < 1 or agent_number > 6:
            raise ValueError("Agent number must be an integer between 1 and 6")
        
        runs = self.client.query("agentRuns:getRunsByAgent", {
            "agentNumber": agent_number
        })
        return runs
    
    def get_latest_run_by_agent(self, agent_number: int) -> Optional[Dict[str, Any]]:
        """
        Get the latest run for a specific agent.
        
        Args:
            agent_number: Agent number (1-6)
            
        Returns:
            Latest run data for the agent, or None if no runs exist
        """
        if not isinstance(agent_number, int) or agent_number < 1 or agent_number > 6:
            raise ValueError("Agent number must be an integer between 1 and 6")
        
        latest_run = self.client.query("agentRuns:getLatestRunByAgent", {
            "agentNumber": agent_number
        })
        return latest_run
    
    def get_all_agents_stats(self) -> List[Dict[str, Any]]:
        """
        Get statistics for all agents.
        
        Returns:
            List of agent statistics including run counts and last updated times
        """
        stats = self.client.query("agentRuns:getAllAgentsStats", {})
        return stats
    
    def clear_agent_runs(self, agent_number: int) -> bool:
        """
        Clear all runs for a specific agent.
        
        Args:
            agent_number: Agent number (1-6)
            
        Returns:
            True if agent was found and cleared, False otherwise
        """
        if not isinstance(agent_number, int) or agent_number < 1 or agent_number > 6:
            raise ValueError("Agent number must be an integer between 1 and 6")
        
        result = self.client.mutation("agentRuns:clearAgentRuns", {
            "agentNumber": agent_number
        })
        return result

# Convenience functions for direct usage
def add_agent_run(agent_number: int, run_data: Dict[str, Any], convex_url: Optional[str] = None) -> str:
    """Convenience function to add a run to an agent."""
    client = ConvexAgentClient(convex_url)
    return client.add_run_to_agent(agent_number, run_data)

def get_agent_runs(agent_number: int, convex_url: Optional[str] = None) -> List[Dict[str, Any]]:
    """Convenience function to get runs for an agent."""
    client = ConvexAgentClient(convex_url)
    return client.get_runs_by_agent(agent_number)

def get_latest_agent_run(agent_number: int, convex_url: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Convenience function to get the latest run for an agent."""
    client = ConvexAgentClient(convex_url)
    return client.get_latest_run_by_agent(agent_number)

def get_agents_stats(convex_url: Optional[str] = None) -> List[Dict[str, Any]]:
    """Convenience function to get all agents statistics."""
    client = ConvexAgentClient(convex_url)
    return client.get_all_agents_stats()

def clear_agent(agent_number: int, convex_url: Optional[str] = None) -> bool:
    """Convenience function to clear an agent's runs."""
    client = ConvexAgentClient(convex_url)
    return client.clear_agent_runs(agent_number)
