"""
Zelle Payment Agent - Parlant agent definition for Zelle workflow
"""
import parlant.sdk as p
from typing import Dict, Any


async def create_zelle_agent(server: p.Server, config: Dict[str, Any]):
    """
    Create and configure a Parlant agent for Zelle payment workflow
    
    Args:
        server: Parlant server instance
        config: Configuration containing credentials and target URL
    
    Returns:
        Configured Parlant agent
    """
    agent = await server.create_agent(
        name="ArcanaRed_Zelle",
        description="Security testing agent for Zelle payment workflows"
    )
    
    # Import tools (these would be defined in server.py)
    from server import (
        playwright_click,
        playwright_type,
        playwright_navigate,
        playwright_screenshot,
        random_delay
    )
    
    # Define the Zelle payment journey
    await agent.create_journey(
        name="zelle_payment_flow",
        description="Complete Zelle payment from login to confirmation",
        steps=[
            {
                "name": "authenticate",
                "description": "Login with provided credentials",
                "success_criteria": "Dashboard page loaded with account information visible"
            },
            {
                "name": "navigate_to_zelle",
                "description": "Find and click Zelle payment button",
                "success_criteria": "Zelle payment form is visible"
            },
            {
                "name": "select_recipient",
                "description": "Choose or enter recipient information",
                "success_criteria": "Recipient selected and amount field is active"
            },
            {
                "name": "enter_amount",
                "description": "Enter payment amount",
                "success_criteria": "Amount entered and submit button is enabled"
            },
            {
                "name": "submit_payment",
                "description": "Submit payment and capture confirmation",
                "success_criteria": "Success message or confirmation displayed"
            }
        ]
    )
    
    # Stealth guidelines - Make agent appear human-like
    await agent.create_guideline(
        condition="Before any click or type action",
        action="Add random delay between 500-2000ms to simulate human hesitation and decision-making",
        tools=[random_delay]
    )
    
    await agent.create_guideline(
        condition="When typing text into any input field",
        action="Type at variable speed with occasional pauses to appear human. Never paste or instant-fill",
        tools=[playwright_type]
    )
    
    await agent.create_guideline(
        condition="When navigating between pages",
        action="Wait for page to fully load and add brief pause before interacting",
        tools=[random_delay]
    )
    
    # Error handling guidelines
    await agent.create_guideline(
        condition="Element not found or selector fails",
        action="Try alternative selectors in order: data-testid, class name, text content, ARIA label. Log each attempt",
        tools=[playwright_click]
    )
    
    await agent.create_guideline(
        condition="Action fails after trying alternatives",
        action="Take screenshot for debugging, log detailed error, and attempt page refresh if appropriate",
        tools=[playwright_screenshot]
    )
    
    await agent.create_guideline(
        condition="Unexpected navigation or modal appears",
        action="Analyze the new state, determine if it's an error or additional step, and adapt accordingly",
        tools=[playwright_screenshot]
    )
    
    # Evidence capture guidelines
    await agent.create_guideline(
        condition="After completing each journey step",
        action="Capture screenshot with descriptive filename indicating the step and timestamp",
        tools=[playwright_screenshot]
    )
    
    await agent.create_guideline(
        condition="Before submitting any payment or critical action",
        action="Take screenshot to capture the pre-submission state for evidence",
        tools=[playwright_screenshot]
    )
    
    await agent.create_guideline(
        condition="When success confirmation or error message appears",
        action="Capture screenshot immediately to document the outcome",
        tools=[playwright_screenshot]
    )
    
    # Workflow-specific guidelines
    await agent.create_guideline(
        condition="On login page",
        action=f"Fill username field with '{config.get('credentials', {}).get('username')}' and password field with the provided password",
        tools=[playwright_type]
    )
    
    await agent.create_guideline(
        condition="Looking for Zelle button on dashboard",
        action="Search for elements with text 'Zelle', 'Send Money', or data-testid containing 'zelle'",
        tools=[playwright_click]
    )
    
    await agent.create_guideline(
        condition="On Zelle payment form",
        action="Fill recipient and amount fields, then locate and click submit button",
        tools=[playwright_type, playwright_click]
    )
    
    return agent
