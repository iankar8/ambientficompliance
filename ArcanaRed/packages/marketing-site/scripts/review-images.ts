#!/usr/bin/env tsx

/**
 * Interactive Image Review Script
 * 
 * Usage:
 *   npm run review-images
 * 
 * Workflow:
 *   1. Shows each generated image
 *   2. Prompts: Approve, Reject, or Edit prompt
 *   3. Converts approved images to WebP
 *   4. Regenerates rejected ones
 */

import * as fs from 'fs'
import * as readline from 'readline'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface ReviewManifest {
  generatedAt: string
  provider: string
  results: Array<{
    id: string
    name: string
    status: string
    localPath?: string
    url?: string
  }>
}

interface ReviewDecision {
  id: string
  name: string
  action: 'approve' | 'reject' | 'edit'
  localPath: string
  editedPrompt?: string
}

class ImageReviewer {
  private rl: readline.Interface
  private decisions: ReviewDecision[] = []

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
  }

  async loadManifest(): Promise<ReviewManifest> {
    const manifestPath = 'public/images/review-manifest.json'
    
    if (!fs.existsSync(manifestPath)) {
      throw new Error('No review manifest found. Run: npm run generate-images first')
    }

    const content = fs.readFileSync(manifestPath, 'utf-8')
    return JSON.parse(content)
  }

  async openImage(path: string): Promise<void> {
    try {
      // macOS
      await execAsync(`open "${path}"`)
    } catch {
      try {
        // Linux
        await execAsync(`xdg-open "${path}"`)
      } catch {
        console.log(`\n⚠️  Could not auto-open. Please open manually: ${path}`)
      }
    }
  }

  async prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim())
      })
    })
  }

  async reviewImage(
    id: string,
    name: string,
    localPath: string
  ): Promise<ReviewDecision> {
    console.log('\n' + '='.repeat(60))
    console.log(`📸 Reviewing: ${name}`)
    console.log(`📂 Path: ${localPath}`)
    console.log('='.repeat(60))

    // Open image in default viewer
    await this.openImage(localPath)
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Give time to load

    while (true) {
      const answer = await this.prompt(
        '\n[A]pprove | [R]eject | [E]dit prompt | [S]kip: '
      )

      const action = answer.toLowerCase()

      if (action === 'a' || action === 'approve') {
        console.log('✅ Approved')
        return { id, name, action: 'approve', localPath }
      }

      if (action === 'r' || action === 'reject') {
        console.log('❌ Rejected - Will regenerate')
        return { id, name, action: 'reject', localPath }
      }

      if (action === 'e' || action === 'edit') {
        const editedPrompt = await this.prompt(
          'Enter edited prompt (or press Enter to keep original): '
        )
        console.log('✏️  Will regenerate with edited prompt')
        return {
          id,
          name,
          action: 'edit',
          localPath,
          editedPrompt: editedPrompt || undefined,
        }
      }

      if (action === 's' || action === 'skip') {
        console.log('⏭️  Skipped')
        return { id, name, action: 'reject', localPath } // Treat skip as reject
      }

      console.log('Invalid input. Please enter A, R, E, or S.')
    }
  }

  async convertToWebP(pngPath: string): Promise<string> {
    const webpPath = pngPath.replace('.png', '.webp')
    
    console.log(`🔄 Converting to WebP: ${pngPath}`)

    try {
      // Try using cwebp (if installed)
      await execAsync(`cwebp -q 85 "${pngPath}" -o "${webpPath}"`)
      console.log(`✅ Converted: ${webpPath}`)
    } catch {
      try {
        // Fallback: ImageMagick
        await execAsync(`magick "${pngPath}" -quality 85 "${webpPath}"`)
        console.log(`✅ Converted: ${webpPath}`)
      } catch {
        console.log(
          `⚠️  Could not convert. Install cwebp or ImageMagick, or use: https://squoosh.app`
        )
        return pngPath // Return original
      }
    }

    return webpPath
  }

  async processApprovals() {
    const approved = this.decisions.filter((d) => d.action === 'approve')
    
    if (approved.length === 0) {
      console.log('\n⚠️  No images approved')
      return
    }

    console.log('\n' + '='.repeat(60))
    console.log('📦 PROCESSING APPROVED IMAGES')
    console.log('='.repeat(60))

    for (const decision of approved) {
      await this.convertToWebP(decision.localPath)
    }

    console.log('\n✅ All approved images processed')
  }

  async generateRejectionList() {
    const rejected = this.decisions.filter((d) => d.action !== 'approve')
    
    if (rejected.length === 0) {
      console.log('\n✅ No images need regeneration')
      return
    }

    const rejectionList = rejected.map((d) => ({
      id: d.id,
      name: d.name,
      reason: d.action === 'edit' ? 'edited_prompt' : 'quality',
      editedPrompt: d.editedPrompt,
    }))

    fs.writeFileSync(
      'public/images/regenerate.json',
      JSON.stringify(rejectionList, null, 2)
    )

    console.log('\n' + '='.repeat(60))
    console.log('🔄 IMAGES TO REGENERATE')
    console.log('='.repeat(60))
    console.log(`\n${rejected.length} images need regeneration:`)
    rejected.forEach((d) => {
      console.log(`   - ${d.name}`)
      if (d.editedPrompt) {
        console.log(`     Edited prompt: ${d.editedPrompt.substring(0, 60)}...`)
      }
    })
    console.log('\n📝 List saved to: public/images/regenerate.json')
    console.log('Run: npm run generate-images -- --only-rejected')
  }

  async run() {
    console.log('🔍 Starting image review...\n')

    // Load manifest
    const manifest = await this.loadManifest()
    const successful = manifest.results.filter((r) => r.status === 'success')

    if (successful.length === 0) {
      console.log('⚠️  No images to review')
      this.rl.close()
      return
    }

    console.log(`Found ${successful.length} images to review\n`)

    // Review each image
    for (const result of successful) {
      if (result.localPath) {
        const decision = await this.reviewImage(
          result.id,
          result.name,
          result.localPath
        )
        this.decisions.push(decision)
      }
    }

    this.rl.close()

    // Process results
    console.log('\n' + '='.repeat(60))
    console.log('📊 REVIEW SUMMARY')
    console.log('='.repeat(60))

    const approved = this.decisions.filter((d) => d.action === 'approve').length
    const rejected = this.decisions.filter((d) => d.action !== 'approve').length

    console.log(`\n✅ Approved: ${approved}`)
    console.log(`❌ Rejected: ${rejected}`)

    // Convert approved images
    if (approved > 0) {
      await this.processApprovals()
    }

    // Generate rejection list
    await this.generateRejectionList()

    // Final instructions
    console.log('\n' + '='.repeat(60))
    console.log('✨ REVIEW COMPLETE')
    console.log('='.repeat(60))
    console.log('\nNext steps:')
    console.log('1. Check converted WebP images in public/images/')
    console.log('2. Update page.tsx to use src="/images/[filename].webp"')
    console.log('3. If needed, regenerate rejected images')
    console.log('4. Commit approved images to git')
  }
}

async function main() {
  const reviewer = new ImageReviewer()
  try {
    await reviewer.run()
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
