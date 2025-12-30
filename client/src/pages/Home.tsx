import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { Download, Lock, Zap, Server, ArrowRight } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-background grid-bg">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-primary mb-4 animate-pulse">
              WELCOME BACK
            </h1>
            <p className="text-secondary text-lg mb-8 font-mono">{user.email}</p>
            <Link href="/dashboard">
              <Button className="cyber-btn text-lg px-8 py-4">
                ENTER COMMAND CENTER
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid-bg overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-transparent to-secondary" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="border-b-2 border-primary bg-card/80 backdrop-blur">
          <div className="container py-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-primary uppercase tracking-widest">
                ▲ TINFOIL SHOP ▼
              </h1>
              <a href={getLoginUrl()}>
                <Button className="cyber-btn">LOGIN</Button>
              </a>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="container py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Column */}
            <div className="space-y-8">
              <div>
                <h2 className="text-5xl lg:text-6xl font-bold text-primary uppercase tracking-widest leading-tight">
                  TORRENT COMMAND CENTER
                </h2>
                <p className="text-secondary text-xl mt-6 font-mono">
                  ▸ Advanced Download Management System ◂
                </p>
              </div>

              <p className="text-foreground text-lg leading-relaxed">
                Manage your torrent downloads with military-grade precision. Real-time progress tracking, automatic Dropbox integration, and secure user authentication for the modern era.
              </p>

              <div className="flex gap-4 pt-4">
                <a href={getLoginUrl()}>
                  <Button className="cyber-btn text-lg px-8 py-4">
                    START SESSION
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </a>
                <Button variant="outline" className="border-2 border-primary text-primary hover:bg-primary/10 text-lg px-8 py-4 font-bold uppercase">
                  DOCUMENTATION
                </Button>
              </div>
            </div>

            {/* Right Column - Features */}
            <div className="space-y-4">
              <Card className="cyber-card group hover:shadow-neon transition-all duration-300">
                <div className="flex gap-4">
                  <Download className="w-8 h-8 text-secondary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-primary uppercase tracking-wider">Torrent Management</h3>
                    <p className="text-sm text-foreground mt-2">
                      Upload and manage .torrent files with real-time progress tracking
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="cyber-card group hover:shadow-neon transition-all duration-300">
                <div className="flex gap-4">
                  <Lock className="w-8 h-8 text-secondary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-primary uppercase tracking-wider">Secure Authentication</h3>
                    <p className="text-sm text-foreground mt-2">
                      JWT-based authentication with admin approval system
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="cyber-card group hover:shadow-neon transition-all duration-300">
                <div className="flex gap-4">
                  <Zap className="w-8 h-8 text-secondary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-primary uppercase tracking-wider">Cloud Integration</h3>
                    <p className="text-sm text-foreground mt-2">
                      Automatic Dropbox sync for downloaded files
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="cyber-card group hover:shadow-neon transition-all duration-300">
                <div className="flex gap-4">
                  <Server className="w-8 h-8 text-secondary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-primary uppercase tracking-wider">Admin Dashboard</h3>
                    <p className="text-sm text-foreground mt-2">
                      Comprehensive control panel for system management
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="border-t-2 border-primary bg-card/80 backdrop-blur py-20">
          <div className="container">
            <h2 className="text-3xl font-bold text-primary uppercase tracking-widest mb-12 text-center">
              ▸ System Capabilities ◂
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Multi-User Support", desc: "Manage multiple user accounts with role-based access" },
                { title: "Queue Management", desc: "Configurable download queue with concurrent limits" },
                { title: "Progress Tracking", desc: "Real-time download and upload progress monitoring" },
                { title: "File Validation", desc: "Automatic .torrent file validation and preview" },
                { title: "Download History", desc: "Complete history of all completed downloads" },
                { title: "Tinfoil Integration", desc: "Generate personalized Tinfoil credentials" },
              ].map((feature, i) => (
                <Card key={i} className="cyber-card group hover:shadow-neon transition-all duration-300">
                  <h3 className="font-bold text-primary uppercase text-sm tracking-wider">{feature.title}</h3>
                  <p className="text-sm text-foreground mt-3">{feature.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="container py-20 text-center">
          <div className="cyber-card max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-primary uppercase mb-4 tracking-widest">
              READY TO CONNECT?
            </h2>
            <p className="text-foreground mb-8 text-lg">
              Sign in with your account or register for a new one to get started.
            </p>
            <a href={getLoginUrl()}>
              <Button className="cyber-btn text-lg px-8 py-4">
                INITIALIZE SESSION
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-primary bg-card/80 backdrop-blur py-8 mt-20">
          <div className="container text-center text-sm text-secondary font-mono">
            <p>TINFOIL SHOP © 2024 | Advanced Torrent Management System</p>
            <p className="mt-2">Powered by Manus AI</p>
          </div>
        </div>
      </div>
    </div>
  );
}
