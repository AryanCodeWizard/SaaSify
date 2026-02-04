import { ArrowRight, CheckCircle2, DollarSign, Globe, HeadphonesIcon, Search, Shield, Sparkles, Star, TrendingUp, Zap } from 'lucide-react';

import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function Home() {
  const [hoveredFeature, setHoveredFeature] = useState(null);

  return (
    <div className="min-h-screen">
      {/* Hero Section - Enhanced */}
      <section className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 text-white py-24 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-purple-400 rounded-full opacity-20 blur-3xl animate-pulse-slow"></div>
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-blue-400 rounded-full opacity-20 blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6 border border-white/20">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Trusted by 10,000+ businesses worldwide</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              Find Your Perfect
              <span className="block bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">
                Domain Name
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-10 text-purple-100 max-w-2xl mx-auto">
              Search millions of domain names with instant availability checks.
              Professional hosting solutions for your business.
            </p>

            {/* Search Box */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex flex-col sm:flex-row gap-3 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20">
                <input
                  type="text"
                  placeholder="Enter your dream domain..."
                  className="flex-1 px-6 py-4 bg-white/90 text-gray-900 rounded-xl placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <Link
                  to="/search"
                  className="btn-shine inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Search size={20} />
                  Search Now
                  <ArrowRight size={20} />
                </Link>
              </div>
              <div className="flex items-center justify-center gap-4 mt-4 text-sm">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-300" />
                  Instant availability
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-300" />
                  Best prices guaranteed
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-12">
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">10k+</div>
                <div className="text-purple-200 text-sm">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">50k+</div>
                <div className="text-purple-200 text-sm">Domains Registered</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">99.9%</div>
                <div className="text-purple-200 text-sm">Uptime</div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Features - Enhanced */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <span className="inline-block px-4 py-2 bg-purple-100 text-purple-600 rounded-full text-sm font-semibold mb-4">
              Why Choose Us
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to
              <span className="gradient-text"> Succeed Online</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to help you build and grow your online presence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Globe className="text-purple-600" size={32} />}
              title="Domain Registration"
              description="Register your domain name in minutes with competitive pricing and instant setup."
              gradient="from-purple-500 to-purple-600"
              index={0}
              hoveredFeature={hoveredFeature}
              setHoveredFeature={setHoveredFeature}
            />
            <FeatureCard
              icon={<Shield className="text-blue-600" size={32} />}
              title="Secure & Private"
              description="Free WHOIS privacy protection and SSL certificates to keep your data safe."
              gradient="from-blue-500 to-blue-600"
              index={1}
              hoveredFeature={hoveredFeature}
              setHoveredFeature={setHoveredFeature}
            />
            <FeatureCard
              icon={<Zap className="text-yellow-600" size={32} />}
              title="Lightning Fast DNS"
              description="Ultra-fast DNS propagation and 99.9% uptime guarantee for all your domains."
              gradient="from-yellow-500 to-orange-500"
              index={2}
              hoveredFeature={hoveredFeature}
              setHoveredFeature={setHoveredFeature}
            />
            <FeatureCard
              icon={<DollarSign className="text-green-600" size={32} />}
              title="Competitive Pricing"
              description="Transparent pricing with no hidden fees. Special rates for bulk purchases."
              gradient="from-green-500 to-emerald-600"
              index={3}
              hoveredFeature={hoveredFeature}
              setHoveredFeature={setHoveredFeature}
            />
            <FeatureCard
              icon={<HeadphonesIcon className="text-pink-600" size={32} />}
              title="24/7 Expert Support"
              description="Expert support team available around the clock to help you succeed."
              gradient="from-pink-500 to-rose-600"
              index={4}
              hoveredFeature={hoveredFeature}
              setHoveredFeature={setHoveredFeature}
            />
            <FeatureCard
              icon={<TrendingUp className="text-indigo-600" size={32} />}
              title="Easy Management"
              description="Intuitive dashboard to manage all your domains and services in one place."
              gradient="from-indigo-500 to-purple-600"
              index={5}
              hoveredFeature={hoveredFeature}
              setHoveredFeature={setHoveredFeature}
            />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Trusted by Industry Leaders</h3>
            <div className="flex items-center justify-center gap-1 text-yellow-400">
              {[...Array(5)].map((_, i) => <Star key={i} fill="currentColor" size={20} />)}
              <span className="ml-2 text-gray-600 font-medium">4.9/5 from 2,500+ reviews</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-purple-100 mb-10">
              Join thousands of satisfied customers who trust SaaSify for their domain needs
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/search"
                className="btn-shine group inline-flex items-center justify-center gap-2 bg-white text-purple-600 px-10 py-5 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all duration-300 shadow-2xl hover:shadow-white/20"
              >
                <Search size={20} />
                Search Domains
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/register"
                className="group inline-flex items-center justify-center gap-2 bg-transparent text-white px-10 py-5 rounded-xl text-lg font-semibold border-2 border-white/30 hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
              >
                Create Account
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <p className="mt-8 text-purple-200 text-sm">
              No credit card required • Free domain privacy • 30-day money-back guarantee
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description, gradient, index, hoveredFeature, setHoveredFeature }) {
  const isHovered = hoveredFeature === index;
  
  return (
    <div 
      className={`card-hover group relative p-8 bg-white rounded-2xl border-2 transition-all duration-300 ${
        isHovered ? 'border-transparent shadow-2xl' : 'border-gray-100 shadow-sm'
      }`}
      onMouseEnter={() => setHoveredFeature(index)}
      onMouseLeave={() => setHoveredFeature(null)}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Gradient background on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
      
      <div className="relative z-10">
        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${gradient} mb-4 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
          <div className="text-white">
            {icon}
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-900 transition-colors">
          {title}
        </h3>
        
        <p className="text-gray-600 leading-relaxed">
          {description}
        </p>

        {/* Arrow indicator on hover */}
        <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="inline-flex items-center text-sm font-semibold text-purple-600">
            Learn more
            <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </div>
    </div>
  );
}
