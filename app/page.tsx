import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LandingNav } from "@/components/landing-nav";
import { getAppNameFromDB } from "@/lib/app-config-server";
import {
  Users,
  Wallet,
  Calendar,
  HandHeart,
  MessageSquare,
  Settings,
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  Smartphone,
  Play,
  ShieldCheck,
  Zap,
  Globe2
} from "lucide-react";

export default async function LandingPage() {
  const appName = await getAppNameFromDB();
  
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100">
      <LandingNav />

      {/* Modern Hero Section with Dark Gradient */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519681393798-3828fb4090bb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2400&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/80 to-slate-900" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium text-blue-300 bg-blue-900/30 border border-blue-700/50 mb-8 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-blue-400 mr-2 animate-pulse"></span>
            v2.0 is here: Advanced Presentation Editor
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight mb-8 leading-tight">
            The Operating System <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
              for Modern Ministry
            </span>
          </h1>
          
          <p className="mt-6 text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-light">
            Manage people, finances, events, and services in one beautiful, integrated platform. 
            Built for churches that want to focus on <span className="text-white font-medium">people</span>, not paperwork.
          </p>
          
          <div className="mt-12 flex flex-col sm:flex-row gap-5 justify-center items-center">
            <Link href="/auth/signin">
              <Button size="lg" className="text-lg px-10 py-7 h-auto rounded-full shadow-2xl shadow-blue-900/20 bg-blue-600 hover:bg-blue-500 transition-all duration-300 hover:scale-105">
                Get Started for Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button variant="outline" size="lg" className="text-lg px-10 py-7 h-auto rounded-full border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-600 bg-transparent backdrop-blur-sm transition-all duration-300">
                <Play className="mr-2 w-5 h-5 fill-current" />
                Watch Demo
              </Button>
            </Link>
          </div>

          {/* Floating UI Mockup */}
          <div className="mt-20 relative mx-auto max-w-6xl transform hover:scale-[1.01] transition-transform duration-700">
            <div className="rounded-2xl bg-slate-800/50 p-2 ring-1 ring-white/10 backdrop-blur-md lg:rounded-3xl lg:p-4 shadow-2xl">
              <div className="rounded-xl bg-slate-900 shadow-2xl overflow-hidden aspect-[16/9] border border-slate-800 relative group">
                {/* Mockup Content */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                  <div className="text-center p-8">
                    <LayoutDashboard className="w-32 h-32 text-slate-700 mx-auto mb-6 group-hover:text-blue-500 transition-colors duration-500" />
                    <p className="text-slate-500 font-medium text-lg">Interactive Dashboard Preview</p>
                  </div>
                </div>
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <div className="bg-slate-900 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-slate-800/50">
            {[
              { label: "Churches", value: "500+" },
              { label: "Members", value: "50k+" },
              { label: "Events", value: "10k+" },
              { label: "Giving", value: "$5M+" },
            ].map((stat, i) => (
              <div key={i} className="px-4">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bento Grid Features */}
      <section className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-blue-600 font-semibold tracking-wide uppercase text-sm mb-3">Features</h2>
            <p className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Everything you need to run your church.
            </p>
            <p className="text-xl text-slate-600">
              A complete suite of tools designed to help your ministry thrive in the digital age.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 auto-rows-[minmax(300px,auto)]">
            {/* Large Card 1 */}
            <div className="md:col-span-2 bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-600/20">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">People & Membership</h3>
                <p className="text-lg text-slate-600 max-w-md mb-8">
                  Go beyond simple lists. Track spiritual journeys, manage family relationships, and ensure no one falls through the cracks with our advanced people management system.
                </p>
                <ul className="space-y-3">
                  {['Family Grouping', 'Attendance Tracking', 'Custom Fields', 'Member Portal'].map((item, i) => (
                    <li key={i} className="flex items-center text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-blue-500 mr-3" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Tall Card */}
            <div className="md:row-span-2 bg-slate-900 rounded-3xl p-8 md:p-12 shadow-xl shadow-slate-900/20 border border-slate-800 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-slate-800/50 to-slate-900" />
              <div className="relative z-10 h-full flex flex-col">
                <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-indigo-500/20">
                  <Smartphone className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Mobile First</h3>
                <p className="text-slate-300 mb-8 flex-grow">
                  Your ministry doesn't happen behind a desk. Neither should your management. Access everything from our powerful mobile app.
                </p>
                <div className="mt-auto relative">
                  <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 transform group-hover:-translate-y-2 transition-transform duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-2 w-20 bg-slate-600 rounded-full" />
                      <div className="h-2 w-8 bg-slate-600 rounded-full" />
                    </div>
                    <div className="space-y-3">
                      <div className="h-16 bg-slate-700/50 rounded-xl w-full" />
                      <div className="h-16 bg-slate-700/50 rounded-xl w-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 group hover:shadow-2xl transition-all duration-300">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6 text-green-600">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Giving & Finance</h3>
              <p className="text-slate-600">
                Secure online giving, recurring donations, and comprehensive financial reporting.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 group hover:shadow-2xl transition-all duration-300">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6 text-orange-600">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Events & Calendar</h3>
              <p className="text-slate-600">
                Coordinate facility usage, manage event registrations, and sync calendars effortlessly.
              </p>
            </div>

            {/* Wide Card */}
            <div className="md:col-span-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-8 md:p-12 shadow-xl shadow-purple-500/20 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm">
                    <HandHeart className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Volunteer Management</h3>
                  <p className="text-purple-100 mb-6">
                    Schedule teams, manage availability, and send automated reminders. Keep your volunteers engaged and appreciated.
                  </p>
                  <Button variant="secondary" className="bg-white text-purple-600 hover:bg-purple-50">
                    Explore Scheduling
                  </Button>
                </div>
                <div className="flex-1 w-full max-w-xs bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-purple-400/30" />
                        <div className="flex-1">
                          <div className="h-2 w-20 bg-white/30 rounded mb-1" />
                          <div className="h-1.5 w-12 bg-white/20 rounded" />
                        </div>
                        <div className="w-4 h-4 rounded-full border-2 border-green-400" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlight: Presentation */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:flex items-center gap-16">
            <div className="lg:w-1/2 mb-12 lg:mb-0">
              <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-orange-600 bg-orange-100 mb-6">
                <Zap className="w-4 h-4 mr-2" />
                New Feature
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">
                Stunning Presentations, <br />
                <span className="text-blue-600">Zero Hassle.</span>
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Create beautiful slide decks for your sermons and announcements directly within {appName || "Shepherd"}. No need for external software.
              </p>
              <div className="space-y-6">
                {[
                  { title: "Drag & Drop Editor", desc: "Intuitive interface for quick slide creation." },
                  { title: "Cloud Sync", desc: "Access your presentations from any device." },
                  { title: "Live Mode", desc: "Present directly from the browser with presenter notes." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{item.title}</h4>
                      <p className="text-slate-600 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-200 to-orange-200 rounded-full blur-3xl opacity-30" />
              <div className="relative bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-2 aspect-video flex items-center justify-center group overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-50 group-hover:scale-105 transition-transform duration-700" />
                <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-full p-4 border border-white/20 cursor-pointer hover:bg-white/20 transition-colors">
                  <Play className="w-8 h-8 text-white fill-current ml-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust/Security Section */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-12">Trusted by churches worldwide</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <ShieldCheck className="w-10 h-10 text-green-500 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Bank-Grade Security</h3>
              <p className="text-slate-600 text-sm">Your data is encrypted and protected with industry-leading security standards.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <Globe2 className="w-10 h-10 text-blue-500 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">99.9% Uptime</h3>
              <p className="text-slate-600 text-sm">Reliable infrastructure ensures your ministry tools are always available.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <MessageSquare className="w-10 h-10 text-purple-500 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Premium Support</h3>
              <p className="text-slate-600 text-sm">Our dedicated team is here to help you succeed every step of the way.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1510936111840-65e151ad71bb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] opacity-20 bg-cover bg-center mix-blend-overlay fixed-bg" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">
            Ready to transform your ministry?
          </h2>
          <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
            Join hundreds of churches using {appName || "Shepherd"} to reach more people and manage their operations effectively.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <Link href="/auth/signin">
              <Button size="lg" className="text-lg px-12 py-8 h-auto bg-white text-slate-900 hover:bg-blue-50 rounded-full font-bold shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
                Start Your Free Trial
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="text-lg px-12 py-8 h-auto border-slate-600 text-white hover:bg-slate-800 hover:text-white rounded-full bg-transparent backdrop-blur-sm">
                Contact Sales
              </Button>
            </Link>
          </div>
          <p className="mt-8 text-slate-500 text-sm">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            <div>
              <h3 className="font-bold text-slate-900 mb-6">Product</h3>
              <ul className="space-y-4 text-slate-600">
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Security</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Roadmap</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-6">Resources</h3>
              <ul className="space-y-4 text-slate-600">
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">API Reference</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Community</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-6">Company</h3>
              <ul className="space-y-4 text-slate-600">
                <li><Link href="#" className="hover:text-blue-600 transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Partners</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-6">Legal</h3>
              <ul className="space-y-4 text-slate-600">
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} {appName || "Shepherd ChMS"}. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="#" className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
              </Link>
              <Link href="#" className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="sr-only">GitHub</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
