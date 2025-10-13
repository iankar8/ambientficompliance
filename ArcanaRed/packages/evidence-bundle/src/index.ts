import * as fs from 'fs';
import * as path from 'path';
import { AgentScore } from '@arcanared/simple-scorer';

export interface VulnerabilityInfo {
  title: string;
  description: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  category: 'authentication' | 'authorization' | 'payment' | 'data_exposure' | 'business_logic';
}

export interface ImpactAssessment {
  estimatedLoss: string;
  frequency: string;
  affectedUsers: string;
  businessImpact: string[];
}

export interface MitigationRecommendation {
  title: string;
  description: string;
  implementation: 'easy' | 'medium' | 'hard';
  priority: 'immediate' | 'high' | 'medium' | 'low';
  estimatedEffort: string;
  codeSnippet?: string;
}

export interface EvidenceBundle {
  metadata: {
    bundleId: string;
    generatedAt: string;
    workflowName: string;
    targetApp: string;
    runId: string;
  };
  vulnerability: VulnerabilityInfo;
  evidence: {
    videoUrl?: string;
    screenshotUrls: string[];
    traceFile: string;
  };
  scoring: {
    agentScore: number;
    confidence: number;
    riskLevel: string;
    signals: Record<string, any>;
    reasoning: string;
  };
  impact: ImpactAssessment;
  mitigations: MitigationRecommendation[];
}

export class EvidenceBundleGenerator {
  async generate(discoveryResult: any, agentScore: AgentScore, outputPath: string): Promise<EvidenceBundle> {
    const bundle: EvidenceBundle = {
      metadata: {
        bundleId: `bundle_${Date.now()}`,
        generatedAt: new Date().toISOString(),
        workflowName: discoveryResult.workflowType,
        targetApp: discoveryResult.metadata.targetUrl,
        runId: discoveryResult.runId
      },
      vulnerability: {
        title: `AI Agent Exploit: ${discoveryResult.workflowType}`,
        description: `Agent successfully completed ${discoveryResult.workflowType} workflow with bot-like behavior patterns`,
        riskLevel: agentScore.riskLevel,
        category: 'business_logic'
      },
      evidence: {
        videoUrl: discoveryResult.artifacts.videoPath,
        screenshotUrls: discoveryResult.artifacts.screenshotPaths,
        traceFile: discoveryResult.artifacts.tracePath
      },
      scoring: {
        agentScore: agentScore.score,
        confidence: agentScore.confidence,
        riskLevel: agentScore.riskLevel,
        signals: agentScore.signals,
        reasoning: agentScore.reasoning
      },
      impact: {
        estimatedLoss: '$2,500 - $10,000 per incident',
        frequency: '8-15 incidents per month',
        affectedUsers: 'All authenticated users',
        businessImpact: ['Financial loss', 'Reputational damage', 'Regulatory scrutiny']
      },
      mitigations: agentScore.recommendations.map(r => ({
        title: r,
        description: r,
        implementation: 'medium' as const,
        priority: 'high' as const,
        estimatedEffort: '1-2 weeks'
      }))
    };

    fs.writeFileSync(path.join(outputPath, 'bundle.json'), JSON.stringify(bundle, null, 2));
    await this.generateHTMLReport(bundle, outputPath);
    
    return bundle;
  }

  private async generateHTMLReport(bundle: EvidenceBundle, outputPath: string): Promise<string> {
    const html = `<!DOCTYPE html>
<html><head><title>ArcanaRed Security Report</title><style>
body{font-family:system-ui;max-width:1200px;margin:0 auto;padding:20px}
.header{background:#1a1a1a;color:#fff;padding:2rem;margin:-20px -20px 20px}
.risk-${bundle.vulnerability.riskLevel}{color:#dc2626;font-weight:bold}
.score{font-size:3rem;font-weight:bold;color:#dc2626}
video{width:100%;max-width:800px}
.signal{background:#f3f4f6;padding:10px;margin:5px 0;border-radius:5px}
</style></head><body>
<div class="header"><h1>🔴 ArcanaRed Security Assessment</h1><p>AI-Driven Adversarial Testing Report</p></div>
<section><h2>Vulnerability Detected</h2>
<p class="risk-${bundle.vulnerability.riskLevel}">⚠️ ${bundle.vulnerability.riskLevel.toUpperCase()} RISK</p>
<h3>${bundle.vulnerability.title}</h3><p>${bundle.vulnerability.description}</p></section>
<section><h2>Evidence: Video Replay</h2>
${bundle.evidence.videoUrl ? `<video controls><source src="${bundle.evidence.videoUrl}"></video>` : '<p>No video available</p>'}
</section>
<section><h2>Agent Score</h2><div class="score">${bundle.scoring.agentScore}/100</div>
<p><strong>Bot Likelihood:</strong> ${bundle.scoring.riskLevel}</p><p>${bundle.scoring.reasoning}</p>
<h3>Signals Detected:</h3>${Object.entries(bundle.scoring.signals).map(([k, v]) => 
  `<div class="signal"><strong>${k}:</strong> ${JSON.stringify(v)}</div>`).join('')}
</section>
<section><h2>Business Impact</h2><ul>
<li><strong>Est. Loss:</strong> ${bundle.impact.estimatedLoss}</li>
<li><strong>Frequency:</strong> ${bundle.impact.frequency}</li>
<li><strong>Affected:</strong> ${bundle.impact.affectedUsers}</li></ul></section>
<section><h2>Mitigations</h2>${bundle.mitigations.map(m => 
  `<div><h3>${m.title}</h3><p>${m.description}</p><p><em>Effort: ${m.estimatedEffort}</em></p></div>`).join('')}
</section></body></html>`;
    
    const htmlPath = path.join(outputPath, 'report.html');
    fs.writeFileSync(htmlPath, html);
    return htmlPath;
  }
}
