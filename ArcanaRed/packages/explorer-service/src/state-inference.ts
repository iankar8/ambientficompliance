/**
 * Workflow State Inference - Automatically detect workflow state from DOM patterns
 * 
 * Instead of requiring manual state labels, infer state from page characteristics
 */

export interface StateSignature {
  name: string;
  confidence: number;
  indicators: {
    urlPattern?: RegExp;
    requiredElements?: string[];
    requiredText?: string[];
    forbiddenElements?: string[];
    pageTitle?: RegExp;
  };
}

export interface StateTransition {
  from: string;
  to: string;
  triggerAction: string;
  confidence: number;
}

/**
 * State inference engine using pattern matching
 */
export class WorkflowStateInference {
  private readonly stateSignatures: StateSignature[];
  private readonly transitionPatterns: StateTransition[];

  constructor(
    signatures: StateSignature[] = DEFAULT_STATE_SIGNATURES,
    transitions: StateTransition[] = DEFAULT_TRANSITIONS
  ) {
    this.stateSignatures = signatures;
    this.transitionPatterns = transitions;
  }

  /**
   * Infer current state from page characteristics
   */
  inferState(pageInfo: {
    url: string;
    title: string;
    visibleText: string;
    presentElements: string[];
  }): { state: string; confidence: number; reasoning: string[] } {
    const matches: Array<{ state: string; confidence: number; reasoning: string[] }> = [];

    for (const signature of this.stateSignatures) {
      const reasons: string[] = [];
      let score = 0;
      let maxScore = 0;

      // Check URL pattern
      if (signature.indicators.urlPattern) {
        maxScore += 20;
        if (signature.indicators.urlPattern.test(pageInfo.url)) {
          score += 20;
          reasons.push(`URL matches ${signature.indicators.urlPattern}`);
        }
      }

      // Check page title
      if (signature.indicators.pageTitle) {
        maxScore += 15;
        if (signature.indicators.pageTitle.test(pageInfo.title)) {
          score += 15;
          reasons.push(`Title matches ${signature.indicators.pageTitle}`);
        }
      }

      // Check required elements
      if (signature.indicators.requiredElements) {
        maxScore += 30;
        const foundElements = signature.indicators.requiredElements.filter(el =>
          pageInfo.presentElements.includes(el)
        );
        if (foundElements.length === signature.indicators.requiredElements.length) {
          score += 30;
          reasons.push(`All required elements present: ${foundElements.join(', ')}`);
        } else if (foundElements.length > 0) {
          score += 15;
          reasons.push(`Some required elements present: ${foundElements.join(', ')}`);
        }
      }

      // Check required text
      if (signature.indicators.requiredText) {
        maxScore += 20;
        const foundText = signature.indicators.requiredText.filter(text =>
          pageInfo.visibleText.toLowerCase().includes(text.toLowerCase())
        );
        if (foundText.length === signature.indicators.requiredText.length) {
          score += 20;
          reasons.push(`All required text found: ${foundText.join(', ')}`);
        } else if (foundText.length > 0) {
          score += 10;
          reasons.push(`Some required text found: ${foundText.join(', ')}`);
        }
      }

      // Check forbidden elements (negative signal)
      if (signature.indicators.forbiddenElements) {
        maxScore += 15;
        const foundForbidden = signature.indicators.forbiddenElements.filter(el =>
          pageInfo.presentElements.includes(el)
        );
        if (foundForbidden.length === 0) {
          score += 15;
          reasons.push('No forbidden elements present');
        } else {
          reasons.push(`Forbidden elements found: ${foundForbidden.join(', ')}`);
        }
      }

      if (maxScore > 0) {
        const confidence = score / maxScore;
        if (confidence >= signature.confidence) {
          matches.push({
            state: signature.name,
            confidence,
            reasoning: reasons
          });
        }
      }
    }

    // Return best match or unknown
    matches.sort((a, b) => b.confidence - a.confidence);
    return matches[0] ?? {
      state: 'unknown',
      confidence: 0,
      reasoning: ['No matching state patterns found']
    };
  }

  /**
   * Predict likely next states given current state and potential actions
   */
  predictNextStates(currentState: string, availableActions: string[]): StateTransition[] {
    return this.transitionPatterns
      .filter(t => t.from === currentState && availableActions.includes(t.triggerAction))
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Validate a state transition
   */
  validateTransition(from: string, to: string, action: string): boolean {
    return this.transitionPatterns.some(
      t => t.from === from && t.to === to && t.triggerAction === action
    );
  }
}

/**
 * Default state signatures for common banking workflows
 */
export const DEFAULT_STATE_SIGNATURES: StateSignature[] = [
  {
    name: 'login_page',
    confidence: 0.6,
    indicators: {
      urlPattern: /\/(login|signin|auth)/i,
      requiredElements: ['input[type="password"]', 'input[type="text"], input[type="email"]'],
      requiredText: ['login', 'sign in', 'username', 'password'],
      forbiddenElements: ['[data-authenticated="true"]']
    }
  },
  {
    name: 'dashboard',
    confidence: 0.6,
    indicators: {
      urlPattern: /\/(dashboard|home|overview)/i,
      requiredText: ['account', 'balance', 'transactions'],
      forbiddenElements: ['input[type="password"]']
    }
  },
  {
    name: 'zelle_form',
    confidence: 0.7,
    indicators: {
      urlPattern: /\/zelle|payment|send/i,
      requiredElements: ['input[type="number"], input[name*="amount"]'],
      requiredText: ['recipient', 'amount', 'send', 'zelle'],
      forbiddenElements: ['input[type="password"]']
    }
  },
  {
    name: 'transfer_form',
    confidence: 0.7,
    indicators: {
      requiredElements: ['select', 'input[type="number"], input[name*="amount"]'],
      requiredText: ['transfer', 'from', 'to', 'amount'],
      forbiddenElements: ['input[type="password"]']
    }
  },
  {
    name: 'confirmation_page',
    confidence: 0.7,
    indicators: {
      urlPattern: /\/(confirmation|success|complete)/i,
      requiredText: ['success', 'confirmed', 'complete', 'receipt'],
      forbiddenElements: ['form input[type="submit"]']
    }
  },
  {
    name: 'error_page',
    confidence: 0.8,
    indicators: {
      requiredText: ['error', 'failed', 'unable to', 'try again'],
      forbiddenElements: []
    }
  },
  {
    name: 'two_factor_auth',
    confidence: 0.8,
    indicators: {
      urlPattern: /\/(2fa|mfa|verify|otp)/i,
      requiredElements: ['input[type="text"]'],
      requiredText: ['verification', 'code', 'two-factor', 'authenticate', 'otp'],
      forbiddenElements: []
    }
  }
];

/**
 * Default state transitions for common workflows
 */
export const DEFAULT_TRANSITIONS: StateTransition[] = [
  { from: 'login_page', to: 'dashboard', triggerAction: 'submit_login', confidence: 0.9 },
  { from: 'login_page', to: 'two_factor_auth', triggerAction: 'submit_login', confidence: 0.3 },
  { from: 'two_factor_auth', to: 'dashboard', triggerAction: 'submit_code', confidence: 0.9 },
  { from: 'dashboard', to: 'zelle_form', triggerAction: 'navigate_to_zelle', confidence: 0.9 },
  { from: 'dashboard', to: 'transfer_form', triggerAction: 'navigate_to_transfer', confidence: 0.9 },
  { from: 'zelle_form', to: 'confirmation_page', triggerAction: 'submit_payment', confidence: 0.85 },
  { from: 'zelle_form', to: 'error_page', triggerAction: 'submit_payment', confidence: 0.15 },
  { from: 'transfer_form', to: 'confirmation_page', triggerAction: 'submit_transfer', confidence: 0.85 },
  { from: 'transfer_form', to: 'error_page', triggerAction: 'submit_transfer', confidence: 0.15 },
  { from: 'error_page', to: 'zelle_form', triggerAction: 'retry', confidence: 0.7 },
  { from: 'error_page', to: 'transfer_form', triggerAction: 'retry', confidence: 0.7 }
];

/**
 * Helper to generate state inference context for agent prompts
 */
export function generateStateInferenceGuidance(): string {
  return `## Automatic State Detection

The system can automatically infer your current workflow state. When analyzing a page:
1. Look for URL patterns (e.g., /login, /dashboard, /zelle)
2. Identify key elements (forms, buttons, inputs)
3. Read visible text for context clues
4. Note what's missing (e.g., no login form means authenticated)

Common states and their indicators:
- **login_page**: Has password input, login/signin text
- **dashboard**: Shows accounts, balances, no password field
- **zelle_form**: Has amount input, recipient selector, zelle/payment text
- **confirmation_page**: Shows success message, no submit buttons
- **error_page**: Contains error/failed text

Report your inferred state with each action for validation.`;
}
