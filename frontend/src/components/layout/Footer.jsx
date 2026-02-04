import { Facebook, Github, Linkedin, Mail, MapPin, Phone, Twitter } from 'lucide-react';

import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-300 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Company */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-xl">S</span>
              </div>
              <h3 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">SaaSify</h3>
            </div>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Your trusted partner for domain registration and enterprise hosting solutions. Building the future of web presence.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-purple-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-blue-500 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110">
                <Linkedin size={18} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110">
                <Github size={18} />
              </a>
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6">Products</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/search" className="hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full group-hover:scale-150 transition-transform"></span>
                  Domain Names
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full group-hover:scale-150 transition-transform"></span>
                  Web Hosting
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full group-hover:scale-150 transition-transform"></span>
                  Email Services
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full group-hover:scale-150 transition-transform"></span>
                  SSL Certificates
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full group-hover:scale-150 transition-transform"></span>
                  DNS Management
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6">Support</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full group-hover:scale-150 transition-transform"></span>
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full group-hover:scale-150 transition-transform"></span>
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full group-hover:scale-150 transition-transform"></span>
                  API Reference
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full group-hover:scale-150 transition-transform"></span>
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full group-hover:scale-150 transition-transform"></span>
                  System Status
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6">Contact Us</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Mail size={16} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Email</p>
                  <a href="mailto:support@saasify.com" className="hover:text-white transition-colors font-medium">support@saasify.com</a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Phone size={16} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Phone</p>
                  <a href="tel:+1234567890" className="hover:text-white transition-colors font-medium">+1 (234) 567-890</a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin size={16} className="text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Address</p>
                  <p className="font-medium">123 Business St, Suite 100<br />San Francisco, CA 94103</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © 2026 SaaSify. All rights reserved. Built with excellence.
            </p>
            <div className="flex gap-6 text-sm">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
            </div>
          </div>
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-full border border-gray-700">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-gray-400">All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
