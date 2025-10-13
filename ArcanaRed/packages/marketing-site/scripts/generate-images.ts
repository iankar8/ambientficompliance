#!/usr/bin/env tsx

/**
 * Image Generation Script with Review Workflow
 * 
 * Usage:
 *   npm run generate-images
 * 
 * Environment Variables:
 *   OPENAI_API_KEY - For DALL-E 3
 *   REPLICATE_API_TOKEN - For Replicate models
 */

import * as fs from 'fs'
import * as path from 'path'
import fetch from 'node-fetch'

interface ImagePrompt {
  id: string
  name: string
  prompt: string
  width: number
  height: number
  outputPath: string
}

// Image definitions from IMAGE_PROMPTS.md
const imagePrompts: ImagePrompt[] = [
  {
    id: 'hero-bg',
    name: 'Hero Background',
    prompt: 'Abstract dark cybersecurity background with glowing blue neural network nodes, AI pathways connecting through space, data streams flowing, cinematic lighting, dark navy and cyan color palette, tech mesh grid, sophisticated and modern, high detail',
    width: 1920,
    height: 1080,
    outputPath: 'public/images/hero-bg.png',
  },
  {
    id: 'workflow-demo',
    name: 'Workflow Simulation Demo',
    prompt: 'Split screen cybersecurity testing interface, left side showing modern banking app UI, right side showing AI decision tree with glowing blue paths, cursor trails and click indicators, dark mode interface, professional security tool aesthetic, detailed and clean',
    width: 1600,
    height: 900,
    outputPath: 'public/images/workflow-demo.png',
  },
  {
    id: 'evidence-bundle',
    name: 'Evidence Bundle Screenshot',
    prompt: 'Professional cybersecurity evidence dashboard, video replay thumbnail with timeline, network request logs, behavioral anomaly scores displayed, code snippets visible, terminal aesthetic with dark background, blue and orange UI highlights, modern security tool interface',
    width: 1600,
    height: 900,
    outputPath: 'public/images/evidence-bundle.png',
  },
  {
    id: 'dashboard-preview',
    name: 'Dashboard Preview',
    prompt: 'Modern cybersecurity SaaS dashboard interface, dark theme with blue accent colors, data visualizations showing graphs and metrics, vulnerability heatmap, workflow status cards, real-time activity feed, clean and professional UI design, detailed',
    width: 1600,
    height: 900,
    outputPath: 'public/images/dashboard-preview.png',
  },
  {
    id: 'process-diagram',
    name: 'Process Flow Diagram',
    prompt: 'Isometric 3D diagram showing 4-stage technology process, connected floating blocks with glowing data streams between them, dark background, blue and cyan gradients, modern tech infographic style, clean geometric shapes, professional illustration',
    width: 1200,
    height: 600,
    outputPath: 'public/images/process-diagram.png',
  },
]

interface GenerationResult {
  id: string
  name: string
  status: 'success' | 'error'
  url?: string
  localPath?: string
  error?: string
}

class ImageGenerator {
  private apiKey: string
  private provider: 'openai' | 'replicate'

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || process.env.REPLICATE_API_TOKEN || ''
    this.provider = process.env.OPENAI_API_KEY ? 'openai' : 'replicate'

    if (!this.apiKey) {
      throw new Error('API key not found. Set OPENAI_API_KEY or REPLICATE_API_TOKEN')
    }
  }

  async generateWithDallE(prompt: ImagePrompt): Promise<string> {
    console.log(`🎨 Generating with DALL-E 3: ${prompt.name}`)

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt.prompt,
        n: 1,
        size: '1792x1024', // DALL-E 3 sizes: 1024x1024, 1792x1024, 1024x1792
        quality: 'hd',
        style: 'natural',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`DALL-E API error: ${error}`)
    }

    const data: any = await response.json()
    return data.data[0].url
  }

  async generateWithReplicate(prompt: ImagePrompt): Promise<string> {
    console.log(`🎨 Generating with Replicate: ${prompt.name}`)

    // Using Flux Dev model (high quality)
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${this.apiKey}`,
      },
      body: JSON.stringify({
        version: 'black-forest-labs/flux-dev',
        input: {
          prompt: prompt.prompt,
          width: prompt.width,
          height: prompt.height,
          num_outputs: 1,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Replicate API error: ${error}`)
    }

    const prediction: any = await response.json()

    // Poll for completion
    return this.pollPrediction(prediction.id)
  }

  async pollPrediction(id: string): Promise<string> {
    let attempts = 0
    const maxAttempts = 60 // 5 minutes

    while (attempts < maxAttempts) {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
        headers: {
          Authorization: `Token ${this.apiKey}`,
        },
      })

      const prediction: any = await response.json()

      if (prediction.status === 'succeeded') {
        return prediction.output[0]
      }

      if (prediction.status === 'failed') {
        throw new Error(`Generation failed: ${prediction.error}`)
      }

      // Wait 5 seconds before next poll
      await new Promise((resolve) => setTimeout(resolve, 5000))
      attempts++
      process.stdout.write('.')
    }

    throw new Error('Generation timeout')
  }

  async downloadImage(url: string, outputPath: string): Promise<void> {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Download failed: ${response.statusText}`)

    const buffer = await response.buffer()
    const dir = path.dirname(outputPath)

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(outputPath, buffer)
    console.log(`✅ Downloaded to: ${outputPath}`)
  }

  async generate(prompt: ImagePrompt): Promise<GenerationResult> {
    try {
      const imageUrl =
        this.provider === 'openai'
          ? await this.generateWithDallE(prompt)
          : await this.generateWithReplicate(prompt)

      await this.downloadImage(imageUrl, prompt.outputPath)

      return {
        id: prompt.id,
        name: prompt.name,
        status: 'success',
        url: imageUrl,
        localPath: prompt.outputPath,
      }
    } catch (error) {
      console.error(`❌ Error generating ${prompt.name}:`, error)
      return {
        id: prompt.id,
        name: prompt.name,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

// Review workflow
function saveReviewManifest(results: GenerationResult[]) {
  const manifest = {
    generatedAt: new Date().toISOString(),
    provider: process.env.OPENAI_API_KEY ? 'openai' : 'replicate',
    results,
    needsReview: results.filter((r) => r.status === 'success').length,
  }

  fs.writeFileSync(
    'public/images/review-manifest.json',
    JSON.stringify(manifest, null, 2)
  )

  console.log('\n📋 Review manifest saved to: public/images/review-manifest.json')
}

function printReviewInstructions(results: GenerationResult[]) {
  console.log('\n' + '='.repeat(60))
  console.log('🎨 IMAGE GENERATION COMPLETE')
  console.log('='.repeat(60))

  const successful = results.filter((r) => r.status === 'success')
  const failed = results.filter((r) => r.status === 'error')

  console.log(`\n✅ Generated: ${successful.length}`)
  console.log(`❌ Failed: ${failed.length}`)

  if (successful.length > 0) {
    console.log('\n📂 Review generated images:')
    successful.forEach((result) => {
      console.log(`   - ${result.localPath}`)
    })

    console.log('\n👀 NEXT STEPS:')
    console.log('1. Open generated images in Finder/Preview')
    console.log('2. Review each image for quality/accuracy')
    console.log('3. Run: npm run review-images')
    console.log('   - Approve/reject each image')
    console.log('   - Regenerate rejected ones')
    console.log('4. Convert approved images to WebP')
  }

  if (failed.length > 0) {
    console.log('\n⚠️  Failed generations:')
    failed.forEach((result) => {
      console.log(`   - ${result.name}: ${result.error}`)
    })
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting image generation...\n')

  // Check for API key
  if (!process.env.OPENAI_API_KEY && !process.env.REPLICATE_API_TOKEN) {
    console.error('❌ Error: No API key found')
    console.log('\nSet one of:')
    console.log('  export OPENAI_API_KEY="sk-..."')
    console.log('  export REPLICATE_API_TOKEN="r8_..."')
    process.exit(1)
  }

  const generator = new ImageGenerator()
  const results: GenerationResult[] = []

  // Generate all images sequentially
  for (const prompt of imagePrompts) {
    const result = await generator.generate(prompt)
    results.push(result)
    console.log('\n' + '-'.repeat(60) + '\n')
  }

  // Save review manifest
  saveReviewManifest(results)

  // Print instructions
  printReviewInstructions(results)
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
