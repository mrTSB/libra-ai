#!/usr/bin/env python3
"""
LLM-Powered Orchestrator API for routing user queries to appropriate agents.
Uses an AI agent to intelligently determine which agent should handle each query.
"""

import os
import logging
import asyncio
import aiohttp
from typing import Dict, Any, Optional, List
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import anthropic

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Agent configurations
AGENT_CONFIGS = {
    "lexi": {
        "name": "Lexi",
        "description": "Legal expert for law-related questions and legal advice. Handles constitutional rights, contract law, legal procedures, compliance, and general legal guidance.",
        "base_url": os.getenv("LEXI_BACKEND_URL", "http://localhost:8000"),
        "endpoint": "/legal/chat",
        "specialties": [
            "constitutional law", "civil rights", "contract law", "criminal law",
            "employment law", "family law", "property law", "legal procedures",
            "compliance", "regulations", "legal advice", "court procedures"
        ]
    },
    "juris": {
        "name": "Juris", 
        "description": "Patent search expert for finding prior art, patent research, and intellectual property analysis. Specializes in innovation research and patentability assessment.",
        "base_url": os.getenv("JURIS_BACKEND_URL", "http://localhost:8001"),
        "endpoint": "/patent/search",
        "specialties": [
            "patent search", "prior art", "intellectual property", "innovation research",
            "patentability", "technology research", "invention analysis", "IP protection"
        ]
    },
    "filora": {
        "name": "Filora",
        "description": "Action agent for web automation, form filling, browser actions, and task execution. Handles practical tasks that require interaction with websites or applications.",
        "base_url": os.getenv("FILORA_BACKEND_URL", "http://localhost:8000"),
        "endpoint": "/action",
        "specialties": [
            "web automation", "form filling", "browser actions", "data extraction",
            "task execution", "website interaction", "application automation"
        ]
    }
}

# Default agent (Lexi)
DEFAULT_AGENT = "lexi"

# Initialize Anthropic client for LLM routing
anthropic_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


class OrchestratorRequest(BaseModel):
    """Request model for the orchestrator endpoint."""
    query: str
    user_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class AgentResponse(BaseModel):
    """Response model for individual agent responses."""
    agent_name: str
    agent_description: str
    input_query: str
    output_response: Dict[str, Any]
    success: bool
    error_message: Optional[str] = None


class OrchestratorResponse(BaseModel):
    """Response model for the orchestrator endpoint."""
    query: str
    selected_agent: str
    agent_description: str
    reasoning: str
    agent_response: AgentResponse
    execution_time: float


class LLMRouter:
    """LLM-based agent routing system."""
    
    def __init__(self):
        self.system_prompt = self._build_system_prompt()
    
    def _build_system_prompt(self) -> str:
        """Build the system prompt for the LLM router."""
        agents_info = []
        for key, config in AGENT_CONFIGS.items():
            specialties = ", ".join(config["specialties"])
            agents_info.append(f"""
{config['name']} ({key}):
- Description: {config['description']}
- Specialties: {specialties}
""")
        
        return f"""You are an intelligent routing agent for the Libra AI system. Your job is to analyze user queries and determine which AI agent should handle them.

Available Agents:
{''.join(agents_info)}

Routing Rules:
1. Analyze the query content, intent, and context
2. Match the query to the agent whose specialties best align with the request
3. Consider the user's intent and what type of assistance they need
4. If the query is unclear or could fit multiple agents, default to Lexi (legal agent)
5. Be specific about why you chose each agent

Response Format:
Return ONLY a JSON object with these exact fields:
{{
    "selected_agent": "agent_key",
    "reasoning": "Detailed explanation of why this agent was chosen",
    "confidence": 0.95
}}

Agent Selection Guidelines:
- Lexi: Legal questions, rights, laws, regulations, legal procedures, compliance
- Juris: Patents, inventions, prior art, intellectual property, innovation research
- Filora: Actions, automation, web tasks, form filling, practical execution tasks

Default to Lexi if the query is unclear or doesn't clearly fit other agents."""

    async def determine_agent(self, query: str) -> tuple[str, str]:
        """
        Use LLM to determine which agent should handle the query.
        Returns (agent_key, reasoning)
        """
        try:
            # Create the user message
            user_message = f"""Analyze this query and determine which agent should handle it:

Query: "{query}"

Please route this to the most appropriate agent based on the content and intent."""

            # Get LLM response (remove await since this is not async)
            response = anthropic_client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=500,
                system=self.system_prompt,
                messages=[
                    {"role": "user", "content": user_message}
                ]
            )
            
            # Extract the response content
            response_text = response.content[0].text.strip()
            
            # Try to parse JSON response
            try:
                import json
                result = json.loads(response_text)
                selected_agent = result.get("selected_agent", DEFAULT_AGENT)
                reasoning = result.get("reasoning", "LLM routing failed, defaulting to Lexi")
                
                # Validate agent selection
                if selected_agent not in AGENT_CONFIGS:
                    logger.warning(f"LLM selected invalid agent: {selected_agent}, defaulting to {DEFAULT_AGENT}")
                    selected_agent = DEFAULT_AGENT
                    reasoning = f"LLM selected invalid agent '{selected_agent}', defaulting to {AGENT_CONFIGS[DEFAULT_AGENT]['name']}"
                
                return selected_agent, reasoning
                
            except json.JSONDecodeError:
                logger.warning(f"LLM response not valid JSON: {response_text}")
                # Fallback: try to extract agent from text
                for agent_key in AGENT_CONFIGS.keys():
                    if agent_key.lower() in response_text.lower():
                        return agent_key, f"Extracted from LLM response: {response_text[:100]}..."
                
                # Default fallback
                return DEFAULT_AGENT, f"LLM response parsing failed, defaulting to {AGENT_CONFIGS[DEFAULT_AGENT]['name']}: {response_text[:100]}..."
                
        except Exception as e:
            logger.error(f"LLM routing failed: {e}")
            return DEFAULT_AGENT, f"LLM routing failed due to error: {str(e)}, defaulting to {AGENT_CONFIGS[DEFAULT_AGENT]['name']}"


class OrchestratorService:
    """Service class for orchestrating agent queries."""
    
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.llm_router = LLMRouter()
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def query_agent(self, agent_key: str, query: str) -> AgentResponse:
        """Query the selected agent and return the response."""
        if not self.session:
            raise HTTPException(status_code=500, detail="Session not initialized")
        
        config = AGENT_CONFIGS[agent_key]
        
        try:
            # Prepare request based on agent type
            if agent_key == "lexi":
                request_data = {
                    "question": query,
                    "use_web_search": True,
                    "use_local_docs": True,
                    "max_local_results": 5,
                    "max_web_results": 3
                }
            elif agent_key == "juris":
                request_data = {
                    "description": query,
                    "use_web_search": True,
                    "use_local_corpus": True,
                    "max_local_results": 5,
                    "max_web_results": 5
                }
            elif agent_key == "filora":
                # Use LLM to dynamically determine the best action type for Filora
                action_analysis = self._analyze_filora_action(query)
                endpoint = action_analysis["endpoint"]
                request_data = action_analysis["request_data"]
            else:
                raise HTTPException(status_code=400, detail=f"Unknown agent: {agent_key}")
            
            # Make the request
            url = f"{config['base_url']}{config['endpoint']}"
            if agent_key == "filora":
                url = f"{config['base_url']}{endpoint}"
            
            async with self.session.post(
                url,
                json=request_data,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                
                if response.status == 200:
                    output_response = await response.json()
                    return AgentResponse(
                        agent_name=config["name"],
                        agent_description=config["description"],
                        input_query=query,
                        output_response=output_response,
                        success=True
                    )
                else:
                    error_text = await response.text()
                    return AgentResponse(
                        agent_name=config["name"],
                        agent_description=config["description"],
                        input_query=query,
                        output_response={},
                        success=False,
                        error_message=f"HTTP {response.status}: {error_text}"
                    )
                    
        except asyncio.TimeoutError:
            return AgentResponse(
                agent_name=config["name"],
                agent_description=config["description"],
                input_query=query,
                output_response={},
                success=False,
                error_message="Request timed out"
            )
        except Exception as e:
            return AgentResponse(
                agent_name=config["name"],
                agent_description=config["description"],
                input_query=query,
                output_response={},
                success=False,
                error_message=f"Request failed: {str(e)}"
            )

    def _analyze_filora_action(self, query: str) -> Dict[str, Any]:
        """
        Use LLM to dynamically determine the best Filora action type and parameters.
        Returns dict with 'endpoint' and 'request_data'.
        """
        try:
            # Create a specialized prompt for Filora action analysis
            action_prompt = f"""You are an expert at analyzing user requests and determining the best web automation action to take.

Analyze this query and determine the most appropriate Filora action:

Query: "{query}"

Available Filora actions:
1. /fill-form - For form filling, data entry, completing applications
2. /click-element - For clicking buttons, links, or specific elements
3. /extract-data - For extracting information from web pages
4. /action - For general automation tasks, navigation, or complex workflows

Consider:
- What is the user trying to accomplish?
- What type of web interaction is needed?
- Is this a form, button click, data extraction, or general automation?

Return ONLY a JSON object with these exact fields:
{{
    "action_type": "fill-form|click-element|extract-data|action",
    "endpoint": "/fill-form|/click-element|/extract-data|/action",
    "reasoning": "Brief explanation of why this action was chosen",
    "request_data": {{
        // Dynamic request data based on action type
    }}
}}

For /fill-form, include form_data array if form fields can be inferred.
For /click-element, include selector and description.
For /action, include instructions and action_type.
For /extract-data, include selectors if data types can be inferred."""

            # Get LLM response
            response = anthropic_client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=500,
                system="You are a web automation expert. Analyze user requests and determine the best automation action.",
                messages=[
                    {"role": "user", "content": action_prompt}
                ]
            )
            
            # Extract and parse the response
            response_text = response.content[0].text.strip()
            
            try:
                import json
                result = json.loads(response_text)
                
                action_type = result.get("action_type", "action")
                endpoint = result.get("endpoint", "/action")
                reasoning = result.get("reasoning", "LLM analysis failed")
                
                # Build request data based on action type
                if action_type == "fill-form":
                    request_data = {
                        "url": "https://example.com",  # Would need URL from context
                        "form_data": result.get("request_data", {}).get("form_data", []),
                        "submit": False
                    }
                elif action_type == "click-element":
                    request_data = {
                        "url": "https://example.com",  # Would need URL from context
                        "selector": result.get("request_data", {}).get("selector", "button"),
                        "description": query
                    }
                elif action_type == "extract-data":
                    request_data = {
                        "url": "https://example.com",  # Would need URL from context
                        "selectors": result.get("request_data", {}).get("selectors", {})
                    }
                else:  # Default to general action
                    request_data = {
                        "url": "https://example.com",  # Would need URL from context
                        "action_type": "general",
                        "instructions": query,
                        "timeout": 30
                    }
                
                logger.info(f"Filora action analysis: {action_type} - {reasoning}")
                return {
                    "endpoint": endpoint,
                    "request_data": request_data,
                    "action_type": action_type,
                    "reasoning": reasoning
                }
                
            except json.JSONDecodeError:
                logger.warning(f"Filora LLM response not valid JSON: {response_text}")
                # Fallback to general action
                return {
                    "endpoint": "/action",
                    "request_data": {
                        "url": "https://example.com",
                        "action_type": "general",
                        "instructions": query,
                        "timeout": 30
                    },
                    "action_type": "action",
                    "reasoning": "LLM parsing failed, using general action"
                }
                
        except Exception as e:
            logger.error(f"Filora action analysis failed: {e}")
            # Fallback to general action
            return {
                "endpoint": "/action",
                "request_data": {
                    "url": "https://example.com",
                    "action_type": "general",
                    "instructions": query,
                    "timeout": 30
                },
                "action_type": "action",
                "reasoning": f"Analysis failed due to error: {str(e)}, using general action"
            }


# FastAPI app setup
app = FastAPI(
    title="Libra AI Orchestrator (LLM-Powered)",
    description="Intelligent AI agent routing using LLM analysis",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint - health check."""
    return {
        "message": "Libra AI Orchestrator (LLM-Powered) is running",
        "status": "healthy",
        "version": "2.0.0",
        "routing_method": "LLM-based intelligent analysis",
        "available_agents": list(AGENT_CONFIGS.keys())
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "orchestrator": "ready", "routing": "LLM-powered"}


@app.get("/agents")
async def list_agents():
    """List all available agents and their capabilities."""
    return {
        "agents": {
            key: {
                "name": config["name"],
                "description": config["description"],
                "base_url": config["base_url"],
                "endpoint": config["endpoint"],
                "specialties": config["specialties"]
            }
            for key, config in AGENT_CONFIGS.items()
        }
    }


@app.post("/orchestrator", response_model=OrchestratorResponse)
async def orchestrate_query(request: OrchestratorRequest):
    """
    Main orchestrator endpoint that uses LLM to intelligently route queries to appropriate agents.
    
    The LLM analyzes the query content and routes to:
    - Lexi: Legal questions and law-related queries (default)
    - Juris: Patent search and prior art queries
    - Filora: Action-oriented tasks and web automation
    """
    import time
    start_time = time.time()
    
    try:
        # Use LLM to determine which agent should handle the query
        orchestrator = OrchestratorService()
        selected_agent, reasoning = await orchestrator.llm_router.determine_agent(request.query)
        
        # Query the selected agent
        async with orchestrator as service:
            agent_response = await service.query_agent(selected_agent, request.query)
            
            # Add Filora action analysis to the response if Filora was selected
            if selected_agent == "filora":
                # Get the action analysis that was used
                action_analysis = service._analyze_filora_action(request.query)
                agent_response.output_response["filora_action_analysis"] = {
                    "action_type": action_analysis["action_type"],
                    "endpoint": action_analysis["endpoint"],
                    "reasoning": action_analysis["reasoning"]
                }
        
        execution_time = time.time() - start_time
        
        return OrchestratorResponse(
            query=request.query,
            selected_agent=selected_agent,
            agent_description=AGENT_CONFIGS[selected_agent]["description"],
            reasoning=reasoning,
            agent_response=agent_response,
            execution_time=execution_time
        )
        
    except Exception as e:
        logger.error(f"Error in orchestrator: {e}")
        raise HTTPException(status_code=500, detail=f"Orchestration failed: {str(e)}")


@app.post("/orchestrator/lexi")
async def direct_lexi_query(request: OrchestratorRequest):
    """Direct query to Lexi (legal agent)."""
    async with OrchestratorService() as orchestrator:
        return await orchestrator.query_agent("lexi", request.query)


@app.post("/orchestrator/juris")
async def direct_juris_query(request: OrchestratorRequest):
    """Direct query to Juris (patent agent)."""
    async with OrchestratorService() as orchestrator:
        return await orchestrator.query_agent("juris", request.query)


@app.post("/orchestrator/filora")
async def direct_filora_query(request: OrchestratorRequest):
    """Direct query to Filora (action agent)."""
    async with OrchestratorService() as orchestrator:
        return await orchestrator.query_agent("filora", request.query)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("orchestrator:app", host="0.0.0.0", port=8005, reload=True)
