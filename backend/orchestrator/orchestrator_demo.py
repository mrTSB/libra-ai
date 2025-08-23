#!/usr/bin/env python3
"""
Demo script for the Libra AI Orchestrator (LLM-Powered).
Shows how the LLM intelligently routes different queries to appropriate agents.
"""

import requests
import json
import time
from typing import Dict, Any


class OrchestratorDemo:
    """Demonstrates the orchestrator's LLM-powered routing capabilities."""
    
    def __init__(self, base_url: str = "http://localhost:8002"):
        self.base_url = base_url
    
    def check_orchestrator(self) -> bool:
        """Check if the orchestrator is running."""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def demo_routing(self):
        """Demonstrate LLM-powered query routing to different agents."""
        print("🎯 Libra AI Orchestrator - LLM-Powered Query Routing Demo")
        print("=" * 70)
        print("🤖 This orchestrator uses AI to intelligently analyze and route queries!")
        print("=" * 70)
        
        if not self.check_orchestrator():
            print("❌ Orchestrator is not running!")
            print("💡 Start it with: python start_orchestrator.py start")
            return
        
        print("✅ Orchestrator is running!")
        print(f"🌐 URL: {self.base_url}")
        print(f"🤖 Routing: LLM-Powered Intelligent Analysis")
        print()
        
        # Demo queries for each agent type
        demo_queries = {
            "Legal Questions (Lexi)": [
                "What are my constitutional rights?",
                "How do I file a lawsuit?",
                "What is contract law?",
                "Legal advice on employment contracts",
                "What are Miranda rights?",
                "How do I protect my intellectual property legally?"
            ],
            "Patent Searches (Juris)": [
                "Search for patents related to machine learning",
                "Find prior art for my AI invention",
                "Patent search for blockchain technology",
                "Check patentability of my software idea",
                "Search for existing patents in robotics",
                "What patents exist for quantum computing?"
            ],
            "Action Tasks (Filora)": [
                "Fill out this form for me",
                "Click the submit button on the website",
                "Automate this web task",
                "Extract data from this page",
                "Navigate to the login page and sign in",
                "Complete this online application for me",
                "Get the price information from this product page",
                "Click on the first search result",
                "Fill out the contact form with my details",
                "Extract all the links from this webpage"
            ],
            "Complex/Ambiguous Queries (LLM Analysis)": [
                "I need help with both legal and patent questions",
                "Can you help me with something?",
                "What should I do about this situation?",
                "I have a problem that might need legal help",
                "Help me understand my options",
                "I'm not sure what kind of help I need"
            ]
        }
        
        total_queries = sum(len(queries) for queries in demo_queries.values())
        current_query = 0
        
        for category, queries in demo_queries.items():
            print(f"🔍 {category}")
            print("-" * 50)
            
            for query in queries:
                current_query += 1
                print(f"\n[{current_query}/{total_queries}] Query: {query}")
                print("🤖 LLM analyzing query...")
                
                try:
                    start_time = time.time()
                    
                    response = requests.post(
                        f"{self.base_url}/orchestrator",
                        json={"query": query},
                        timeout=30
                    )
                    
                    execution_time = time.time() - start_time
                    
                    if response.status_code == 200:
                        result = response.json()
                        
                        # Display results
                        print(f"   🎯 Selected Agent: {result['selected_agent'].upper()}")
                        print(f"   💭 LLM Reasoning: {result['reasoning']}")
                        print(f"   ⏱️  Execution Time: {result['execution_time']:.2f}s")
                        
                        if result['agent_response']['success']:
                            print(f"   ✅ Agent Response: Success")
                            
                            # Show a snippet of the response
                            response_data = result['agent_response']['output_response']
                            if isinstance(response_data, dict):
                                if 'answer' in response_data:
                                    answer = response_data['answer'][:150] + "..." if len(response_data['answer']) > 150 else response_data['answer']
                                    print(f"   📝 Answer: {answer}")
                                elif 'similar_patents' in response_data:
                                    count = len(response_data['similar_patents'])
                                    print(f"   📚 Found {count} patents")
                                elif 'result' in response_data:
                                    print(f"   🔧 Action Result: {response_data['result']}")
                        else:
                            print(f"   ❌ Agent Error: {result['agent_response']['error_message']}")
                    else:
                        print(f"   ❌ HTTP Error: {response.status_code}")
                        print(f"   📄 Response: {response.text[:200]}...")
                        
                except requests.exceptions.Timeout:
                    print(f"   ⏰ Timeout after 30 seconds")
                except Exception as e:
                    print(f"   ❌ Error: {str(e)}")
                
                # Small delay between queries
                time.sleep(0.5)
            
            print()
        
        print("=" * 70)
        print("🎉 LLM-Powered Demo completed!")
        print(f"🌐 Orchestrator API: {self.base_url}")
        print(f"📚 Documentation: {self.base_url}/docs")
        print(f"📋 Available Agents: {self.base_url}/agents")
        print("🤖 The LLM successfully analyzed and routed all queries intelligently!")
    
    def demo_direct_queries(self):
        """Demonstrate direct agent queries."""
        print("\n🎯 Direct Agent Query Demo")
        print("=" * 50)
        
        direct_tests = [
            ("lexi", "What is due process in constitutional law?"),
            ("juris", "Search for patents related to quantum computing"),
            ("filora", "Click the login button and fill out the form")
        ]
        
        for agent, query in direct_tests:
            print(f"\n🔍 Direct {agent.upper()} Query: {query}")
            
            try:
                response = requests.post(
                    f"{self.base_url}/orchestrator/{agent}",
                    json={"query": query},
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"   ✅ Success: {result['agent_name']}")
                    if result['success']:
                        print(f"   📤 Response received successfully")
                    else:
                        print(f"   ❌ Agent Error: {result['error_message']}")
                else:
                    print(f"   ❌ HTTP Error: {response.status_code}")
                    
            except Exception as e:
                print(f"   ❌ Request failed: {str(e)}")
    
    def show_agent_capabilities(self):
        """Show what each agent can do."""
        print("\n📋 Agent Capabilities")
        print("=" * 50)
        
        try:
            response = requests.get(f"{self.base_url}/agents", timeout=5)
            if response.status_code == 200:
                agents = response.json()
                
                for agent_key, agent_info in agents["agents"].items():
                    print(f"\n🤖 {agent_info['name']} ({agent_key})")
                    print(f"   📝 Description: {agent_info['description']}")
                    print(f"   🌐 Endpoint: {agent_info['endpoint']}")
                    print(f"   🎯 Specialties: {', '.join(agent_info['specialties'][:5])}...")
            else:
                print(f"❌ Failed to get agent info: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error getting agent info: {str(e)}")
    
    def demo_filora_actions(self):
        """Demonstrate Filora's dynamic action analysis capabilities."""
        print("\n🤖 Filora Dynamic Action Analysis Demo")
        print("=" * 60)
        print("🔧 Testing how Filora intelligently determines action types...")
        
        filora_queries = [
            "Fill out the registration form with my information",
            "Click the login button on the homepage",
            "Extract the product prices from this e-commerce page",
            "Navigate to the contact page and fill out the form",
            "Click on the first article in the news section",
            "Get all the email addresses from this contact page",
            "Fill out the job application form",
            "Click the download button for the PDF file",
            "Extract the table data from this financial report",
            "Automate the checkout process on this website"
        ]
        
        for i, query in enumerate(filora_queries, 1):
            print(f"\n🔍 Filora Query {i}: {query}")
            print("🤖 LLM analyzing best action type...")
            
            try:
                response = requests.post(
                    f"{self.base_url}/orchestrator",
                    json={"query": query},
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result['selected_agent'] == 'filora':
                        print(f"   🎯 Selected: Filora")
                        if result['agent_response']['success']:
                            response_data = result['agent_response']['output_response']
                            if 'filora_action_analysis' in response_data:
                                action_info = response_data['filora_action_analysis']
                                print(f"   🤖 Action Type: {action_info['action_type']}")
                                print(f"   📍 Endpoint: {action_info['endpoint']}")
                                print(f"   💭 Reasoning: {action_info['reasoning']}")
                                print(f"   ⏱️  Analysis Time: {result['execution_time']:.2f}s")
                            else:
                                print(f"   ⚠️  No action analysis available")
                        else:
                            print(f"   ❌ Agent Error: {result['agent_response']['error_message']}")
                    else:
                        print(f"   ⚠️  Routed to {result['selected_agent']} instead of Filora")
                else:
                    print(f"   ❌ Error: HTTP {response.status_code}")
                    
            except Exception as e:
                print(f"   ❌ Request failed: {str(e)}")
            
            time.sleep(0.5)
    
    def demo_llm_analysis(self):
        """Demonstrate the LLM's analysis capabilities."""
        print("\n🧠 LLM Analysis Capabilities Demo")
        print("=" * 50)
        print("🤖 Testing how the LLM analyzes complex queries...")
        
        complex_queries = [
            "I need help with a legal issue but also want to check if my idea is patentable",
            "Can you help me understand what kind of assistance I need?",
            "I'm confused about whether this is a legal question or something else",
            "Help me figure out what type of help I need for my situation"
        ]
        
        for i, query in enumerate(complex_queries, 1):
            print(f"\n🔍 Complex Query {i}: {query}")
            print("🤖 LLM analyzing intent and context...")
            
            try:
                response = requests.post(
                    f"{self.base_url}/orchestrator",
                    json={"query": query},
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"   🎯 LLM Decision: {result['selected_agent'].upper()}")
                    print(f"   💭 Reasoning: {result['reasoning']}")
                    print(f"   ⏱️  Analysis Time: {result['execution_time']:.2f}s")
                else:
                    print(f"   ❌ Error: HTTP {response.status_code}")
                    
            except Exception as e:
                print(f"   ❌ Request failed: {str(e)}")
            
            time.sleep(0.5)


def main():
    """Main demo function."""
    demo = OrchestratorDemo()
    
    # Run the main routing demo
    demo.demo_routing()
    
    # Show agent capabilities
    demo.show_agent_capabilities()
    
    # Run direct query demo
    demo.demo_direct_queries()
    
    # Run Filora dynamic action demo
    demo.demo_filora_actions()
    
    # Run LLM analysis demo
    demo.demo_llm_analysis()
    
    print("\n" + "=" * 70)
    print("🎯 LLM-Powered Demo Summary")
    print("=" * 70)
    print("The LLM-powered orchestrator successfully analyzed queries and routed them:")
    print("• Legal questions → Lexi (Legal AI)")
    print("• Patent searches → Juris (Patent Search)")
    print("• Action tasks → Filora (Dynamic Action Analysis)")
    print("• Complex/ambiguous queries → Intelligent LLM analysis with Lexi default")
    print("\n🤖 Key Benefits of LLM Routing:")
    print("• Context-aware analysis beyond simple keywords")
    print("• Handles ambiguous and complex queries intelligently")
    print("• Understands user intent and context")
    print("• Graceful fallback to Lexi when uncertain")
    print("• Dynamic Filora action selection based on query analysis")
    print("\n💡 Try your own queries with: python test_orchestrator.py interactive")


if __name__ == "__main__":
    main()
