import type { Tool as AnthropicTool } from '@anthropic-ai/sdk/resources/messages';

/**
 * Smart Selector Discovery - Teaches agent to find elements intelligently
 * 
 * Provides tools for semantic element discovery instead of hardcoded selectors
 */

export const SMART_DISCOVERY_TOOLS: AnthropicTool[] = [
  {
    name: 'analyze_page',
    description: 'Analyze the current page to discover interactive elements and understand page state. Call this before taking actions to understand what\'s available.',
    input_schema: {
      type: 'object',
      properties: {
        focus: {
          type: 'string',
          description: 'What to focus analysis on (e.g., "forms", "buttons", "navigation", "all")'
        }
      },
      required: ['focus']
    }
  },
  {
    name: 'find_element',
    description: 'Intelligently find an element by semantic description rather than exact selector. Use natural language to describe what you\'re looking for.',
    input_schema: {
      type: 'object',
      properties: {
        intent: {
          type: 'string',
          description: 'What you want to do (e.g., "login button", "username field", "submit payment")'
        },
        elementType: {
          type: 'string',
          enum: ['button', 'input', 'link', 'select', 'textarea', 'any'],
          description: 'Type of element to find'
        },
        textContains: {
          type: 'string',
          description: 'Text content the element should contain (optional)'
        },
        attributes: {
          type: 'object',
          description: 'Expected attributes (optional, e.g., {"type": "submit", "role": "button"})'
        }
      },
      required: ['intent', 'elementType']
    }
  },
  {
    name: 'interact',
    description: 'Perform an action on a discovered element. This combines element discovery with action execution.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['click', 'type', 'select', 'navigate', 'wait'],
          description: 'Action to perform'
        },
        target: {
          type: 'string',
          description: 'Semantic description of target element (e.g., "password input field")'
        },
        value: {
          type: 'string',
          description: 'Value for type/select actions'
        },
        state: {
          type: 'string',
          description: 'Current workflow state (e.g., "login_form", "payment_form")'
        },
        reasoning: {
          type: 'string',
          description: 'Why this action moves toward the goal'
        }
      },
      required: ['action', 'target', 'state', 'reasoning']
    }
  },
  {
    name: 'verify_state',
    description: 'Verify the current page state matches expectations. Helps detect navigation success or failures.',
    input_schema: {
      type: 'object',
      properties: {
        expectedState: {
          type: 'string',
          description: 'Expected state (e.g., "authenticated_dashboard", "payment_confirmation")'
        },
        indicators: {
          type: 'array',
          items: { type: 'string' },
          description: 'Elements or text that should be present to confirm this state'
        }
      },
      required: ['expectedState', 'indicators']
    }
  }
];

/**
 * System prompt for intelligent agent navigation
 */
export const SMART_NAVIGATION_SYSTEM_PROMPT = `You are ArcanaRed Explorer, an intelligent workflow automation agent.

INTELLIGENCE PRINCIPLES:
1. **Semantic Discovery**: Find elements by their purpose, not hardcoded selectors
2. **State Awareness**: Analyze page state before each action
3. **Goal-Oriented**: Each action should clearly move toward completing the workflow goal
4. **Self-Correcting**: If an approach fails, try alternatives
5. **Efficient**: Take the most direct path to completion

WORKFLOW PROCESS:
1. Call analyze_page to understand current state
2. Determine next logical action toward goal
3. Use interact to perform actions with semantic targeting
4. Use verify_state to confirm progress
5. Repeat until goal achieved

SELECTOR PRIORITY (use in this order):
1. ARIA roles and labels (button[role="submit"], aria-label="Login")
2. Test IDs (data-testid="submit-button")
3. Semantic HTML (button, input[type="email"])
4. Visible text content (button:contains("Submit"))
5. IDs and names (id="submit", name="username")
6. CSS selectors (only as last resort)

ERROR HANDLING:
- If an element can't be found, try alternative descriptions
- If an action fails, analyze the page again to understand why
- If stuck after 3 attempts, report detailed error and stop

OUTPUT:
- Use interact tool for all actions (it handles discovery + execution)
- Provide clear reasoning for each action
- Track state transitions explicitly

NEVER:
- Hardcode exact CSS selectors unless no alternative exists
- Take actions without analyzing page state first
- Continue if clearly off-track or blocked
- Make assumptions about element locations

Begin each workflow by analyzing the page, then proceed goal by goal.`;

/**
 * Smart selector patterns that agents should learn
 */
export interface SelectorPattern {
  intent: string;
  priority: Array<{
    strategy: string;
    pattern: string;
    confidence: number;
  }>;
}

export const COMMON_SELECTOR_PATTERNS: SelectorPattern[] = [
  {
    intent: 'login_button',
    priority: [
      { strategy: 'role', pattern: 'button[role="button"]', confidence: 0.9 },
      { strategy: 'testid', pattern: '[data-testid*="login"]', confidence: 0.95 },
      { strategy: 'text', pattern: 'button:contains("Log in", "Login", "Sign in")', confidence: 0.85 },
      { strategy: 'type', pattern: 'button[type="submit"]', confidence: 0.7 }
    ]
  },
  {
    intent: 'username_field',
    priority: [
      { strategy: 'testid', pattern: '[data-testid*="username"]', confidence: 0.95 },
      { strategy: 'name', pattern: 'input[name="username"]', confidence: 0.9 },
      { strategy: 'autocomplete', pattern: 'input[autocomplete="username"]', confidence: 0.85 },
      { strategy: 'type', pattern: 'input[type="text"]:first-of-type', confidence: 0.6 }
    ]
  },
  {
    intent: 'password_field',
    priority: [
      { strategy: 'type', pattern: 'input[type="password"]', confidence: 0.95 },
      { strategy: 'testid', pattern: '[data-testid*="password"]', confidence: 0.95 },
      { strategy: 'name', pattern: 'input[name="password"]', confidence: 0.9 }
    ]
  },
  {
    intent: 'submit_payment',
    priority: [
      { strategy: 'testid', pattern: '[data-testid*="submit"]', confidence: 0.9 },
      { strategy: 'text', pattern: 'button:contains("Submit", "Send", "Pay", "Confirm")', confidence: 0.85 },
      { strategy: 'role', pattern: 'button[role="button"]', confidence: 0.7 }
    ]
  },
  {
    intent: 'amount_field',
    priority: [
      { strategy: 'testid', pattern: '[data-testid*="amount"]', confidence: 0.95 },
      { strategy: 'name', pattern: 'input[name*="amount"]', confidence: 0.9 },
      { strategy: 'type', pattern: 'input[type="number"]', confidence: 0.8 },
      { strategy: 'label', pattern: 'input[aria-label*="amount"]', confidence: 0.85 }
    ]
  }
];

/**
 * Helper to generate selector discovery hints for prompts
 */
export function generateSelectorHints(intents: string[]): string {
  const hints: string[] = ['## Selector Discovery Hints\n'];
  
  intents.forEach(intent => {
    const pattern = COMMON_SELECTOR_PATTERNS.find(p => p.intent === intent);
    if (pattern) {
      hints.push(`**${intent}**:`);
      pattern.priority
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3)
        .forEach(p => {
          hints.push(`  - ${p.strategy}: \`${p.pattern}\` (confidence: ${(p.confidence * 100).toFixed(0)}%)`);
        });
      hints.push('');
    }
  });

  return hints.join('\n');
}
