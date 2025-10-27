import Link from "next/link";
import { ArrowRight, Shield, Zap, Database } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">ArcanaSentinel</h1>
          </div>
          <Link
            href="/console"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Open Console
          </Link>
        </div>

        {/* Hero */}
        <div className="max-w-4xl mx-auto text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            Agent-Ready in 1 Day
          </div>
          <h2 className="text-5xl font-bold text-foreground mb-6">
            Accept AI Agent Orders
            <br />
            <span className="text-primary">Without Changing PSPs</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Protocol orchestration (Visa TAP, Mastercard Agent Pay, OpenAI ACP, Google AP2),
            LLM-readable content, evidence collection, and returns management—all in one platform.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/console"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              View Live Demo
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-secondary transition-colors font-medium"
            >
              Read Docs
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="p-6 bg-white rounded-xl border border-border shadow-sm">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Protocol Orchestration</h3>
            <p className="text-muted-foreground">
              One API for Visa TAP, Mastercard Agent Pay, OpenAI ACP, and Google AP2.
              Adapters keep you future-proof.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-border shadow-sm">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Evidence Collection</h3>
            <p className="text-muted-foreground">
              Capture mandates, SPC/3DS artifacts, and policy snapshots to win disputes
              and reduce chargebacks.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-border shadow-sm">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Synthetic Data Mode</h3>
            <p className="text-muted-foreground">
              Test the entire flow with realistic synthetic merchants, products, and agents.
              No PSP accounts needed.
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="mt-20 max-w-2xl mx-auto p-6 bg-white rounded-xl border border-border">
          <div className="flex items-start gap-4">
            <div className="h-2 w-2 bg-green-500 rounded-full mt-2 animate-pulse" />
            <div>
              <h4 className="font-semibold mb-1">System Status: Operational</h4>
              <p className="text-sm text-muted-foreground">
                Running in <span className="font-mono text-primary">SYNTHETIC_MODE</span>.
                All data is generated for demonstration purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
