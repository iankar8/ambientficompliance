#!/usr/bin/env node
import { DiscoveryAgent } from '@arcanared/discovery-agent';
import { SimpleScorer } from '@arcanared/simple-scorer';
import { EvidenceBundleGenerator } from '@arcanared/evidence-bundle';
import * as path from 'path';

async function main() {
  console.log('🚀 ArcanaRed Discovery Agent\n');

  // Configuration from environment
  const config = {
    targetUrl: process.env.TARGET_URL || 'http://localhost:4000',
    workflowType: (process.env.WORKFLOW_TYPE || 'zelle_send') as any,
    credentials: {
      username: process.env.USERNAME || 'demouser',
      password: process.env.PASSWORD || 'Demo1234!'
    },
    outputPath: process.env.OUTPUT_PATH || path.join(process.cwd(), 'tmp', 'discovery')
  };

  console.log('Configuration:');
  console.log(`  Target: ${config.targetUrl}`);
  console.log(`  Workflow: ${config.workflowType}`);
  console.log(`  Output: ${config.outputPath}\n`);

  try {
    // Step 1: Run discovery
    const agent = new DiscoveryAgent(config);
    const discoveryResult = await agent.discover();

    // Step 2: Compute score
    console.log('\n📊 Computing agent score...');
    const scorer = new SimpleScorer();
    const agentScore = scorer.computeScore(discoveryResult.trace.events);
    
    console.log(`\n🎯 Agent Score: ${agentScore.score}/100`);
    console.log(`   Risk Level: ${agentScore.riskLevel.toUpperCase()}`);
    console.log(`   Confidence: ${(agentScore.confidence * 100).toFixed(0)}%`);

    // Step 3: Generate evidence bundle
    console.log('\n📦 Generating evidence bundle...');
    const bundleGen = new EvidenceBundleGenerator();
    const bundle = await bundleGen.generate(
      discoveryResult,
      agentScore,
      path.dirname(discoveryResult.artifacts.tracePath)
    );

    console.log('\n✅ Discovery complete!');
    console.log(`\n📁 Results: ${config.outputPath}/${discoveryResult.runId}`);
    console.log(`   - Video: ${discoveryResult.artifacts.videoPath || 'N/A'}`);
    console.log(`   - Screenshots: ${discoveryResult.artifacts.screenshotPaths.length}`);
    console.log(`   - Bundle: bundle.json`);
    console.log(`   - Report: report.html`);

  } catch (error) {
    console.error('\n❌ Discovery failed:', error);
    process.exit(1);
  }
}

main();
