import { useState, useEffect } from 'react'
import { Building2, Users, MessageSquare, DollarSign, Wrench, FileText, ArrowRight, Check, Menu, X } from 'lucide-react'

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float-delayed"></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-lg border-b border-white/10' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-8 h-8 text-purple-500" />
              <span className="text-2xl font-bold gradient-text">CoLiv</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="hover:text-purple-400 transition-colors">Features</a>
              <a href="#benefits" className="hover:text-purple-400 transition-colors">Benefits</a>
              <div className="flex gap-4">
                <a 
                  href="https://co-liv-tenant.vercel.app/login" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg border border-purple-500/50 hover:bg-purple-500/10 transition-all"
                >
                  Tenant Portal
                </a>
                <a 
                  href="https://co-liv.vercel.app/login" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all"
                >
                  Operator Portal
                </a>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2"
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-4">
              <a href="#features" className="block hover:text-purple-400">Features</a>
              <a href="#benefits" className="block hover:text-purple-400">Benefits</a>
              <div className="space-y-2 pt-4">
                <a 
                  href="https://co-liv-tenant.vercel.app/login" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center px-4 py-2 rounded-lg border border-purple-500/50"
                >
                  Tenant Portal
                </a>
                <a 
                  href="https://co-liv.vercel.app/login" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600"
                >
                  Operator Portal
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Modern Property Management<br />
              <span className="gradient-text">for Co-Living Spaces</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto">
              Streamline operations, automate payments, and enhance tenant communication with CoLiv's all-in-one platform designed specifically for co-living properties.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <a 
                href="https://co-liv.vercel.app/login" 
                target="_blank"
                rel="noopener noreferrer"
                className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all flex items-center gap-2"
              >
                Get Started Free
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a 
                href="#features"
                className="px-8 py-4 glass-effect rounded-xl font-semibold text-lg hover:bg-white/10 transition-all"
              >
                Learn More
              </a>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>14-day free trial</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to <span className="gradient-text">Manage Co-Living</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Purpose-built features for operators managing multiple tenants in shared living spaces
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <DollarSign className="w-8 h-8" />,
                title: "Automated Payments",
                description: "Stripe-powered payment processing with automatic rent collection, custom payment requests, and instant confirmations."
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Tenant Management",
                description: "Track tenant information, lease details, and payment history all in one centralized dashboard."
              },
              {
                icon: <MessageSquare className="w-8 h-8" />,
                title: "Communication Hub",
                description: "Built-in messaging system, announcements, and notifications keep everyone informed and connected."
              },
              {
                icon: <Wrench className="w-8 h-8" />,
                title: "Maintenance Tracking",
                description: "Submit, track, and resolve maintenance requests with priority levels and status updates."
              },
              {
                icon: <FileText className="w-8 h-8" />,
                title: "Document Management",
                description: "Securely store and share leases, rules, and important documents with tenants."
              },
              {
                icon: <Building2 className="w-8 h-8" />,
                title: "Multi-Property Support",
                description: "Manage multiple properties, units, and rooms from a single, unified platform."
              },
            ].map((feature, idx) => (
              <div key={idx} className="glass-effect rounded-2xl p-8 hover:bg-white/10 transition-all group">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-6 bg-gradient-to-b from-transparent to-purple-900/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Built for <span className="gradient-text">Co-Living Operators</span>
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Whether you're managing a single co-living house or multiple properties with hundreds of tenants, CoLiv scales with your business.
              </p>
              <div className="space-y-6">
                {[
                  "Reduce administrative work by 80%",
                  "Get paid faster with automated billing",
                  "Improve tenant satisfaction with better communication",
                  "Scale your operations effortlessly",
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <Check className="w-4 h-4" />
                    </div>
                    <p className="text-lg">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 blur-3xl"></div>
              <div className="relative glass-effect rounded-2xl p-8">
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl p-6">
                    <div className="text-4xl font-bold gradient-text">$12,450</div>
                    <div className="text-gray-400 mt-2">Monthly revenue tracked</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="text-2xl font-bold">24</div>
                      <div className="text-gray-400 text-sm">Active Tenants</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="text-2xl font-bold">98%</div>
                      <div className="text-gray-400 text-sm">On-time Payments</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-effect rounded-3xl p-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your <span className="gradient-text">Co-Living Business?</span>
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Join forward-thinking property operators who are modernizing their operations with CoLiv.
            </p>
            <a 
              href="https://co-liv.vercel.app/login" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all"
            >
              Start Free Trial
              <ArrowRight />
            </a>
            <p className="text-sm text-gray-500 mt-4">No credit card required • 14-day free trial • Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-purple-500" />
              <span className="text-xl font-bold">CoLiv</span>
            </div>
            <div className="flex gap-8 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
            <p className="text-gray-500">© 2024 CoLiv. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App


