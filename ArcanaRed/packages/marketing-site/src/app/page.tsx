'use client'

import Button from '@/components/Button'
import { Shield, ArrowRight, Check, PlayCircle } from 'lucide-react'
import { motion, useScroll, useSpring } from 'framer-motion'
import { FadeIn } from '@/components/animations/FadeIn'
import { Stagger, StaggerItem } from '@/components/animations/Stagger'
import { fadeUp, staggerItem } from '@/lib/animations'
import { OptimizedImage } from '@/components/OptimizedImage'
import { gradients } from '@/lib/gradients'

export default function Home() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  return (
    <main className="min-h-screen">
      {/* Scroll Progress */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-cyan-400 origin-left z-50"
        style={{ scaleX }}
      />

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="fixed top-0 w-full z-40 bg-black/50 backdrop-blur-lg border-b border-white/10"
      >
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex items-center justify-between h-16">
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Shield className="w-6 h-6 text-primary" />
              <span className="text-lg font-semibold">ArcanaRed</span>
            </motion.div>
            <Button size="sm">Get Access</Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        {/* Animated background gradient */}
        <div 
          className="absolute inset-0 opacity-50"
          style={{ background: gradients.hero }}
        />
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <motion.h1
            className="text-5xl md:text-6xl font-bold mb-6 tracking-tight leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Test your workflows before{' '}
            <motion.span
              className="text-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              AI agents exploit them
            </motion.span>
          </motion.h1>
          <motion.p
            className="text-xl text-white/60 mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Simulate AI-driven attacks. Capture evidence. Ship fixes.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Button size="lg" className="group">
              Request Pilot Access
              <motion.span
                className="inline-block ml-2"
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.span>
            </Button>
            <Button size="lg" variant="secondary" className="group">
              <PlayCircle className="mr-2 w-5 h-5" />
              Watch Demo
            </Button>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 border-t border-white/10">
        <div className="container mx-auto max-w-5xl">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold mb-16 text-center">How It Works</h2>
          </FadeIn>
          <Stagger className="grid md:grid-cols-4 gap-8" staggerDelay={0.15}>
            <StaggerItem variants={fadeUp}>
              <Step number="1" title="Simulate" description="AI explores your workflows" />
            </StaggerItem>
            <StaggerItem variants={fadeUp}>
              <Step number="2" title="Capture" description="Record every action" />
            </StaggerItem>
            <StaggerItem variants={fadeUp}>
              <Step number="3" title="Score" description="Detect bot behavior" />
            </StaggerItem>
            <StaggerItem variants={fadeUp}>
              <Step number="4" title="Fix" description="Get mitigation code" />
            </StaggerItem>
          </Stagger>

          {/* Process Diagram Visual */}
          <FadeIn className="mt-16">
            <OptimizedImage
              alt="AI Testing Process Flow Diagram"
              gradient={gradients.process}
              width={1200}
              height={600}
              className="mx-auto max-w-4xl"
              priority={false}
            />
          </FadeIn>
        </div>
      </section>

      {/* Workflow Demo Section */}
      <section className="py-24 px-6 bg-white/5">
        <div className="container mx-auto max-w-6xl">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
              See AI Agents in Action
            </h2>
            <p className="text-white/60 text-center mb-12 max-w-2xl mx-auto">
              Watch how our platform simulates real attack patterns and captures evidence
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <OptimizedImage
              alt="AI Agent Workflow Simulation Demo"
              gradient={gradients.workflow}
              width={1600}
              height={900}
              className="shadow-2xl shadow-primary/20"
              priority={false}
            />
          </FadeIn>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-24 px-6 border-t border-white/10">
        <div className="container mx-auto max-w-5xl">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold mb-16 text-center">
              Stop AI Fraud Before It Starts
            </h2>
          </FadeIn>
          <Stagger className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto" staggerDelay={0.1}>
            <StaggerItem variants={fadeUp}>
              <Benefit title="Proactive Testing" description="Find exploits in staging, not production" />
            </StaggerItem>
            <StaggerItem variants={fadeUp}>
              <Benefit title="Video Evidence" description="Frame-perfect replay of attack patterns" />
            </StaggerItem>
            <StaggerItem variants={fadeUp}>
              <Benefit title="Actionable Fixes" description="Mitigation code ready to merge" />
            </StaggerItem>
            <StaggerItem variants={fadeUp}>
              <Benefit title="Compliance Ready" description="Immutable audit logs & encryption" />
            </StaggerItem>
          </Stagger>

          {/* Evidence Bundle Visual */}
          <FadeIn className="mt-16">
            <OptimizedImage
              alt="Evidence Bundle Dashboard with Video Replay"
              gradient={gradients.evidence}
              width={1600}
              height={900}
              className="shadow-2xl shadow-primary/10"
            />
          </FadeIn>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24 px-6 border-t border-white/10">
        <div className="container mx-auto max-w-5xl">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">Built for Critical Workflows</h2>
            <p className="text-white/60 text-center mb-16 max-w-2xl mx-auto">
              Test the workflows that protect your revenue
            </p>
          </FadeIn>
          <Stagger className="grid md:grid-cols-3 gap-6" staggerDelay={0.15}>
            <StaggerItem variants={fadeUp}>
              <UseCase title="P2P Payments" items={['Zelle transfers', 'Beneficiary limits', 'Velocity checks']} />
            </StaggerItem>
            <StaggerItem variants={fadeUp}>
              <UseCase title="Account Linking" items={['External accounts', 'Step-up auth', 'Device verification']} />
            </StaggerItem>
            <StaggerItem variants={fadeUp}>
              <UseCase title="Account Takeover" items={['Session hijacking', 'Credential stuffing', 'MFA bypass']} />
            </StaggerItem>
          </Stagger>

          {/* Dashboard Preview */}
          <FadeIn className="mt-20">
            <OptimizedImage
              alt="ArcanaRed Security Dashboard"
              gradient={gradients.dashboard}
              width={1600}
              height={900}
              className="shadow-2xl shadow-primary/20 border border-white/10"
            />
          </FadeIn>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 bg-white/5">
        <div className="container mx-auto max-w-3xl">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold mb-16 text-center">FAQ</h2>
          </FadeIn>
          <Stagger className="space-y-8" staggerDelay={0.1}>
            <StaggerItem variants={fadeUp}>
              <FAQ 
                q="How is this different from bot detection?" 
                a="Bot detection blocks attacks in production. We find exploits in staging before they're used." 
              />
            </StaggerItem>
            <StaggerItem variants={fadeUp}>
              <FAQ 
                q="Do you need production access?" 
                a="No. All testing runs in your isolated staging environment." 
              />
            </StaggerItem>
            <StaggerItem variants={fadeUp}>
              <FAQ 
                q="How long does onboarding take?" 
                a="Under 90 minutes. Provide staging access, define workflows, we handle the rest." 
              />
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-white/10">
        <FadeIn className="container mx-auto max-w-3xl text-center">
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Ready to test your defenses?
          </motion.h2>
          <motion.p
            className="text-xl text-white/60 mb-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Join fraud prevention teams protecting financial workflows
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Button size="lg" className="group">
              Request Pilot Access
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <p className="text-sm text-white/40 mt-6">Limited to 10 pilot partners</p>
          </motion.div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-semibold">ArcanaRed</span>
              </div>
              <p className="text-sm text-white/60">AI Adversarial Testing</p>
            </div>
            <div>
              <h4 className="font-medium mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-sm text-white/40">
            &copy; 2025 ArcanaRed. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  )
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <motion.div
      className="text-center"
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <motion.div
        className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold mx-auto mb-4"
        whileHover={{ scale: 1.1, backgroundColor: 'rgba(59, 130, 246, 0.2)' }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        {number}
      </motion.div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-white/60">{description}</p>
    </motion.div>
  )
}

function Benefit({ title, description }: { title: string; description: string }) {
  return (
    <motion.div
      className="flex gap-3"
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
    >
      <motion.div
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
      >
        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
      </motion.div>
      <div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-white/60">{description}</p>
      </div>
    </motion.div>
  )
}

function UseCase({ title, items }: { title: string; items: string[] }) {
  return (
    <motion.div
      className="p-6 rounded-lg border border-white/10 hover:border-primary/50 transition-colors"
      whileHover={{
        y: -8,
        boxShadow: '0 10px 40px rgba(59, 130, 246, 0.15)',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <h3 className="font-semibold mb-4">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <motion.li
            key={i}
            className="text-sm text-white/60 flex items-center gap-2"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <motion.span
              className="w-1 h-1 rounded-full bg-primary"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 + 0.2 }}
            />
            {item}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  )
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <motion.div
      className="p-6 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
      whileHover={{ x: 4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <h3 className="font-semibold mb-2">{q}</h3>
      <p className="text-white/60">{a}</p>
    </motion.div>
  )
}
