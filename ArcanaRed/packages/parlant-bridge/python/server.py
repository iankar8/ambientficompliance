"""
Parlant Bridge Service - FastAPI server for ArcanaRed agent orchestration
"""
import os
from typing import Dict, Any, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import parlant.sdk as p
import httpx

# Configuration
PLAYWRIGHT_BRIDGE_URL = os.getenv("PLAYWRIGHT_BRIDGE_URL", "http://localhost:5000")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

# In-memory agent sessions (use Redis in production)
active_sessions: Dict[str, Any] = {}


class ExecuteRequest(BaseModel):
    workflow: str
    config: Dict[str, Any]
    sessionId: str


class ToolExecuteRequest(BaseModel):
    tool: str
    params: Dict[str, Any]


class AgentResponse(BaseModel):
    sessionId: str
    status: str
    events: list = []
    trace: Optional[Dict[str, Any]] = None
    explanation: Optional[Dict[str, Any]] = None


# Parlant tool wrappers
@p.tool
async def playwright_click(context: p.ToolContext, selector: str) -> p.ToolResult:
    """Click an element on the page"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{PLAYWRIGHT_BRIDGE_URL}/tools/execute",
                json={"tool": "click", "params": {"selector": selector}},
                timeout=30.0
            )
            result = response.json()
            if result.get("success"):
                return p.ToolResult(f"Clicked element: {selector}")
            else:
                return p.ToolResult(f"Failed to click: {result.get('error')}", error=True)
        except Exception as e:
            return p.ToolResult(f"Error clicking element: {str(e)}", error=True)


@p.tool
async def playwright_type(context: p.ToolContext, selector: str, text: str, delay_ms: int = 100) -> p.ToolResult:
    """Type text into an input field"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{PLAYWRIGHT_BRIDGE_URL}/tools/execute",
                json={"tool": "type", "params": {"selector": selector, "text": text, "delay": delay_ms}},
                timeout=30.0
            )
            result = response.json()
            if result.get("success"):
                return p.ToolResult(f"Typed '{text}' into {selector}")
            else:
                return p.ToolResult(f"Failed to type: {result.get('error')}", error=True)
        except Exception as e:
            return p.ToolResult(f"Error typing text: {str(e)}", error=True)


@p.tool
async def playwright_navigate(context: p.ToolContext, url: str) -> p.ToolResult:
    """Navigate to a URL"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{PLAYWRIGHT_BRIDGE_URL}/tools/execute",
                json={"tool": "navigate", "params": {"url": url}},
                timeout=30.0
            )
            result = response.json()
            if result.get("success"):
                return p.ToolResult(f"Navigated to {url}")
            else:
                return p.ToolResult(f"Failed to navigate: {result.get('error')}", error=True)
        except Exception as e:
            return p.ToolResult(f"Error navigating: {str(e)}", error=True)


@p.tool
async def playwright_screenshot(context: p.ToolContext, path: str) -> p.ToolResult:
    """Take a screenshot"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{PLAYWRIGHT_BRIDGE_URL}/tools/execute",
                json={"tool": "screenshot", "params": {"path": path}},
                timeout=30.0
            )
            result = response.json()
            if result.get("success"):
                return p.ToolResult(f"Screenshot saved: {path}")
            else:
                return p.ToolResult(f"Failed to screenshot: {result.get('error')}", error=True)
        except Exception as e:
            return p.ToolResult(f"Error taking screenshot: {str(e)}", error=True)


@p.tool
async def random_delay(context: p.ToolContext, min_ms: int = 500, max_ms: int = 2000) -> p.ToolResult:
    """Add random delay to appear human-like"""
    import random
    import asyncio
    
    delay = random.randint(min_ms, max_ms)
    await asyncio.sleep(delay / 1000)
    return p.ToolResult(f"Delayed {delay}ms")


# Parlant server instance
parlant_server: Optional[p.Server] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup Parlant server"""
    global parlant_server
    parlant_server = p.Server()
    await parlant_server.__aenter__()
    print("✅ Parlant server started")
    yield
    await parlant_server.__aexit__(None, None, None)
    print("👋 Parlant server stopped")


# FastAPI app
app = FastAPI(
    title="ArcanaRed Parlant Bridge",
    description="Bridge service between TypeScript ArcanaRed and Python Parlant",
    version="0.1.0",
    lifespan=lifespan
)

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "parlant-bridge",
        "parlant_ready": parlant_server is not None,
        "playwright_url": PLAYWRIGHT_BRIDGE_URL
    }


@app.post("/api/agent/execute", response_model=AgentResponse)
async def execute_agent(request: ExecuteRequest):
    """Execute an agent for a specific workflow"""
    if not parlant_server:
        raise HTTPException(status_code=500, detail="Parlant server not initialized")
    
    try:
        # Create agent for workflow
        agent_name = f"ArcanaRed_{request.workflow}_{request.sessionId}"
        
        agent = await parlant_server.create_agent(
            name=agent_name,
            description=f"Security testing agent for {request.workflow} workflow"
        )
        
        # Store session
        active_sessions[request.sessionId] = {
            "agent": agent,
            "workflow": request.workflow,
            "config": request.config
        }
        
        # TODO: Load workflow-specific journey and guidelines
        # For now, return success
        
        return AgentResponse(
            sessionId=request.sessionId,
            status="created",
            events=[],
            trace={"message": "Agent created, ready for journey execution"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create agent: {str(e)}")


@app.get("/api/agent/{session_id}/status")
async def get_agent_status(session_id: str):
    """Get status of an agent session"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = active_sessions[session_id]
    return {
        "sessionId": session_id,
        "workflow": session["workflow"],
        "status": "active"
    }


@app.post("/api/agent/{session_id}/stop")
async def stop_agent(session_id: str):
    """Stop an agent session"""
    if session_id in active_sessions:
        del active_sessions[session_id]
        return {"sessionId": session_id, "status": "stopped"}
    
    raise HTTPException(status_code=404, detail="Session not found")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
