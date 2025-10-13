/**
 * Semantic Workflow Builder - Describes workflows by intent rather than steps
 * 
 * Instead of: "1. Navigate to X, 2. Click Y, 3. Type Z"
 * Use: "Login as user, then send Zelle payment"
 */

export interface WorkflowIntent {
  name: string;
  description: string;
  goals: string[];
  context: {
    baseUrl: string;
    credentials?: Record<string, string>;
    testData?: Record<string, unknown>;
  };
  constraints?: string[];
  expectedOutcome: string;
}

export interface SelectorStrategy {
  priority: ('role' | 'aria-label' | 'testid' | 'name' | 'id' | 'text-content' | 'css')[];
  fallbackBehavior: 'error' | 'ask-user' | 'best-effort';
}

/**
 * Generates intelligent, goal-oriented prompts for the agent
 */
export class SemanticWorkflowBuilder {
  constructor(private readonly selectorStrategy: SelectorStrategy = {
    priority: ['role', 'aria-label', 'testid', 'name', 'id', 'text-content', 'css'],
    fallbackBehavior: 'best-effort'
  }) {}

  buildPrompt(intent: WorkflowIntent): string {
    const sections: string[] = [];

    // Mission statement
    sections.push(`# Mission: ${intent.name}`);
    sections.push(intent.description);
    sections.push('');

    // Goals (not steps!)
    sections.push('## Goals to Achieve:');
    intent.goals.forEach((goal, i) => {
      sections.push(`${i + 1}. ${goal}`);
    });
    sections.push('');

    // Context
    sections.push('## Environment Context:');
    sections.push(`- Base URL: ${intent.context.baseUrl}`);
    if (intent.context.credentials) {
      sections.push('- Credentials available:');
      Object.entries(intent.context.credentials).forEach(([key, value]) => {
        sections.push(`  * ${key}: ${value}`);
      });
    }
    if (intent.context.testData) {
      sections.push('- Test data:');
      Object.entries(intent.context.testData).forEach(([key, value]) => {
        sections.push(`  * ${key}: ${JSON.stringify(value)}`);
      });
    }
    sections.push('');

    // Selector intelligence guidance
    sections.push('## Selector Strategy:');
    sections.push('When locating elements, prioritize in this order:');
    this.selectorStrategy.priority.forEach((strategy, i) => {
      sections.push(`${i + 1}. ${this.describeStrategy(strategy)}`);
    });
    sections.push('');

    // Navigation instructions
    sections.push('## Navigation Instructions:');
    sections.push('- Analyze the current page state before each action');
    sections.push('- Infer the next logical step based on the goal');
    sections.push('- Use semantic element discovery (buttons for actions, inputs for data entry)');
    sections.push('- If a goal is blocked, try alternative approaches');
    sections.push('- Call record_action for each action taken');
    sections.push('');

    // Constraints
    if (intent.constraints && intent.constraints.length > 0) {
      sections.push('## Constraints:');
      intent.constraints.forEach(constraint => {
        sections.push(`- ${constraint}`);
      });
      sections.push('');
    }

    // Expected outcome
    sections.push('## Success Criteria:');
    sections.push(intent.expectedOutcome);
    sections.push('');

    sections.push('Begin by navigating to the base URL and analyzing the page state.');

    return sections.join('\n');
  }

  private describeStrategy(strategy: string): string {
    switch (strategy) {
      case 'role':
        return 'ARIA roles (button, link, textbox, etc.) - most semantic';
      case 'aria-label':
        return 'aria-label attributes - explicit labels';
      case 'testid':
        return 'data-testid attributes - test-stable identifiers';
      case 'name':
        return 'name attributes - form field names';
      case 'id':
        return 'id attributes - unique identifiers';
      case 'text-content':
        return 'visible text content - user-facing labels';
      case 'css':
        return 'CSS selectors - last resort, fragile';
      default:
        return strategy;
    }
  }
}

/**
 * Common workflow intent templates
 */
export const WORKFLOW_INTENTS = {
  zellePayment: (baseUrl: string, credentials: Record<string, string>): WorkflowIntent => ({
    name: 'Zelle Payment Flow',
    description: 'Complete a Zelle payment from authentication through confirmation',
    goals: [
      'Authenticate with provided credentials',
      'Navigate to Zelle payment interface',
      'Select or enter a recipient',
      'Specify payment amount and optional note',
      'Submit the payment',
      'Verify successful completion'
    ],
    context: {
      baseUrl,
      credentials,
      testData: {
        amount: '25.00',
        note: 'Test payment'
      }
    },
    constraints: [
      `Stay within ${baseUrl} domain`,
      'Handle CAPTCHA or 2FA by logging and stopping',
      'Use first available recipient if multiple exist'
    ],
    expectedOutcome: 'Payment confirmation page displayed with transaction details'
  }),

  login: (baseUrl: string, credentials: Record<string, string>): WorkflowIntent => ({
    name: 'User Authentication',
    description: 'Log into the application with provided credentials',
    goals: [
      'Navigate to login page',
      'Enter username and password',
      'Submit credentials',
      'Verify successful authentication (dashboard or home page loaded)'
    ],
    context: {
      baseUrl,
      credentials
    },
    expectedOutcome: 'Authenticated dashboard or home page is displayed'
  }),

  transfer: (baseUrl: string, credentials: Record<string, string>): WorkflowIntent => ({
    name: 'Internal Transfer',
    description: 'Transfer funds between user accounts',
    goals: [
      'Authenticate if needed',
      'Navigate to transfers section',
      'Select source and destination accounts',
      'Enter transfer amount',
      'Submit transfer',
      'Verify completion'
    ],
    context: {
      baseUrl,
      credentials,
      testData: {
        fromAccount: 'Checking',
        toAccount: 'Savings',
        amount: '100.00'
      }
    },
    expectedOutcome: 'Transfer confirmation displayed with updated balances'
  })
};
