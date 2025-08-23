#!/usr/bin/env python3
"""
Test script for the Libra AI Orchestrator (LLM-Powered).
Tests the LLM-based routing logic and agent communication.
"""

import requests
import json
import time
from typing import Dict, Any


class OrchestratorTestClient:
    """Test client for the Orchestrator API."""
    
    def __init__(self, base_url: str = "http://localhost:8005"):
        self.base_url = base_url
    
    def test_health(self) -> bool:
        """Test health endpoint."""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def test_agents_list(self) -> Dict[str, Any]:
        """Test agents listing endpoint."""
        try:
            response = requests.get(f"{self.base_url}/agents", timeout=5)
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"HTTP {response.status_code}"}
        except Exception as e:
            return {"error": str(e)}
    
    def test_orchestrator(self, query: str) -> Dict[str, Any]:
        """Test the main orchestrator endpoint."""
        try:
            request_data = {
                "query": query,
                "user_id": "test_user",
                "context": {"test": True}
            }
            
            response = requests.post(
                f"{self.base_url}/orchestrator",
                json=request_data,
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"HTTP {response.status_code}", "details": response.text}
                
        except Exception as e:
            return {"error": str(e)}
    
    def test_direct_agent(self, agent: str, query: str) -> Dict[str, Any]:
        """Test direct agent query."""
        try:
            request_data = {
                "query": query,
                "user_id": "test_user"
            }
            
            response = requests.post(
                f"{self.base_url}/orchestrator/{agent}",
                json=request_data,
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"HTTP {response.status_code}", "details": response.text}
                
        except Exception as e:
            return {"error": str(e)}


def run_orchestrator_tests():
    """Run comprehensive tests of the orchestrator."""
    print("🧪 Testing Libra AI Orchestrator (LLM-Powered)")
    print("=" * 60)
    print("🤖 This orchestrator uses LLM-based intelligent routing!")
    print("=" * 60)
    
    client = OrchestratorTestClient()
    
    # Test 1: Health check
    print("\n1. 🏥 Health Check")
    if client.test_health():
        print("   ✅ Orchestrator is healthy")
    else:
        print("   ❌ Orchestrator health check failed")
        return
    
    # Test 2: List agents
    print("\n2. 📋 Available Agents")
    agents = client.test_agents_list()
    if "error" not in agents:
        for agent_key, agent_info in agents["agents"].items():
            print(f"   • {agent_info['name']}: {agent_info['description']}")
            print(f"     Specialties: {', '.join(agent_info['specialties'][:3])}...")
    else:
        print(f"   ❌ Failed to get agents: {agents['error']}")
    
    # Test 3: Test LLM routing logic with different query types
    print("\n3. 🎯 Testing LLM-Powered Query Routing")
    print("   🤖 The LLM will intelligently analyze each query...")
    
    test_queries = [
        # Legal queries (should route to Lexi)
        "What are my constitutional rights?",
        "How do I file a lawsuit?",
        "What is contract law?",
        "Legal advice on employment contracts",
        "What are Miranda rights?",
        
        # Patent queries (should route to Juris)
        "Search for patents related to machine learning",
        "Find prior art for my invention",
        "Patent search for AI technology",
        "Check patentability of my software idea",
        "Search for existing patents in robotics",
        
        # Action queries (should route to Filora)
        "Fill out this form for me",
        "Click the submit button on the website",
        "Automate this web task",
        "Extract data from this page",
        "Navigate to the login page and sign in",
        
        # General queries (should default to Lexi)
        "Hello, how are you?",
        "What's the weather like?",
        "Tell me a joke",
        "Random question about nothing",
        
        # Edge cases for LLM analysis
        "I need help with both legal and patent questions",
        "Can you help me with something?",
        "What should I do about this situation?"
    ]
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n   Query {i}: {query}")
        result = client.test_orchestrator(query)
        
        if "error" not in result:
            print(f"      🎯 Selected Agent: {result['selected_agent']}")
            print(f"      💭 LLM Reasoning: {result['reasoning']}")
            print(f"      ⏱️  Execution Time: {result['execution_time']:.2f}s")
            
            if result['agent_response']['success']:
                print(f"      ✅ Agent Response: Success")
                # Print a snippet of the response
                response_data = result['agent_response']['output_response']
                if isinstance(response_data, dict):
                    if 'answer' in response_data:
                        print(f"      📝 Answer: {response_data['answer'][:200]}...")
                    elif 'similar_patents' in response_data:
                        print(f"      📚 Found {len(response_data['similar_patents'])} patents")
                    elif 'result' in response_data:
                        print(f"      🔧 Action Result: {response_data['result']}")
                    # Show Filora action analysis if available
                    if 'filora_action_analysis' in response_data:
                        action_info = response_data['filora_action_analysis']
                        print(f"      🤖 Filora Action: {action_info['action_type']}")
                        print(f"      �� Endpoint: {action_info['endpoint']}")
                        print(f"      💭 Reasoning: {action_info['reasoning']}")
            else:
                print(f"      ❌ Agent Response: {result['agent_response']['error_message']}")
        else:
            print(f"      ❌ Orchestrator Error: {result['error']}")
    
    # Test 4: Test direct agent queries
    print("\n4. 🎯 Testing Direct Agent Queries")
    
    direct_tests = [
        ("lexi", "What is due process in constitutional law?"),
        ("juris", "Search for software patents"),
        ("filora", "Click the login button")
    ]
    
    for agent, query in direct_tests:
        print(f"\n   Direct {agent.upper()} Query: {query}")
        result = client.test_direct_agent(agent, query)
        
        if "error" not in result:
            print(f"      ✅ Success: {result['agent_name']}")
            if result['success']:
                print(f"      📤 Response received")
            else:
                print(f"      ❌ Error: {result['error_message']}")
        else:
            print(f"      ❌ Request failed: {result['error']}")
    
    print("\n" + "=" * 60)
    print("🎉 LLM-Powered Orchestrator testing completed!")
    print("🤖 The LLM successfully analyzed and routed queries intelligently!")


def interactive_mode():
    """Interactive testing mode."""
    print("🎮 Interactive Orchestrator Testing Mode (LLM-Powered)")
    print("🤖 The LLM will intelligently route your queries!")
    print("Type 'quit' to exit")
    print("=" * 60)
    
    client = OrchestratorTestClient()
    
    while True:
        try:
            query = input("\n🤖 Enter your query: ").strip()
            
            if query.lower() in ['quit', 'exit', 'q']:
                break
            
            if not query:
                continue
            
            print(f"\n🔄 Processing: {query}")
            print("🤖 LLM analyzing query and determining best agent...")
            start_time = time.time()
            
            result = client.test_orchestrator(query)
            
            if "error" not in result:
                print(f"🎯 Selected Agent: {result['selected_agent']}")
                print(f"💭 LLM Reasoning: {result['reasoning']}")
                print(f"⏱️  Execution Time: {result['execution_time']:.2f}s")
                
                if result['agent_response']['success']:
                    print(f"✅ Agent Response: Success")
                    # Print a snippet of the response
                    response_data = result['agent_response']['output_response']
                    if isinstance(response_data, dict):
                        if 'answer' in response_data:
                            print(f"📝 Answer: {response_data['answer'][:200]}...")
                        elif 'similar_patents' in response_data:
                            print(f"📚 Found {len(response_data['similar_patents'])} patents")
                        elif 'result' in response_data:
                            print(f"🔧 Action Result: {response_data['result']}")
                        # Show Filora action analysis if available
                        if 'filora_action_analysis' in response_data:
                            action_info = response_data['filora_action_analysis']
                            print(f"🤖 Filora Action: {action_info['action_type']}")
                            print(f"📍 Endpoint: {action_info['endpoint']}")
                            print(f"💭 Reasoning: {action_info['reasoning']}")
                else:
                    print(f"❌ Agent Error: {result['agent_response']['error_message']}")
            else:
                print(f"❌ Orchestrator Error: {result['error']}")
                
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
    
    print("\n👋 Goodbye!")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "interactive":
        interactive_mode()
    else:
        run_orchestrator_tests()
