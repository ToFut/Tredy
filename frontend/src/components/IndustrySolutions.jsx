import React from "react";
import BusinessChat from "./BusinessChat";

export default function IndustrySolutions() {
  return (
    <section className="py-20 bg-gradient-to-br from-purple-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Industry Solutions
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how Tredy AI adapts to your specific industry, creating intelligent workflows 
            that understand your business needs and automate complex processes.
          </p>
        </div>

        {/* Business Platform Demo */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">
              Real Estate Business Platform
            </h3>
            <p className="text-gray-600">
              Experience how Tredy AI creates a complete business intelligence platform 
              tailored for real estate professionals.
            </p>
          </div>
          
          {/* Business Chat Component */}
          <div className="flex justify-center">
            <BusinessChat />
          </div>
        </div>

        {/* Industry Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-gray-800 mb-3">Real Estate</h4>
            <p className="text-gray-600 mb-4">
              Lead generation, property management, client communication, and CRM automation 
              specifically designed for real estate professionals.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Automated lead response</li>
              <li>• Property listing management</li>
              <li>• Client follow-up workflows</li>
              <li>• Market analysis automation</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-gray-800 mb-3">Healthcare</h4>
            <p className="text-gray-600 mb-4">
              Patient management, appointment scheduling, medical records automation, 
              and compliance workflows for healthcare providers.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Patient intake automation</li>
              <li>• Appointment reminders</li>
              <li>• Medical record management</li>
              <li>• Compliance reporting</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-gray-800 mb-3">E-commerce</h4>
            <p className="text-gray-600 mb-4">
              Inventory management, customer service automation, order processing, 
              and marketing campaign optimization for online retailers.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Inventory tracking</li>
              <li>• Customer support bots</li>
              <li>• Order fulfillment</li>
              <li>• Marketing automation</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-gray-800 mb-3">Finance</h4>
            <p className="text-gray-600 mb-4">
              Financial analysis, risk assessment, compliance monitoring, 
              and client portfolio management for financial institutions.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Risk analysis automation</li>
              <li>• Compliance monitoring</li>
              <li>• Portfolio management</li>
              <li>• Client reporting</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-gray-800 mb-3">Manufacturing</h4>
            <p className="text-gray-600 mb-4">
              Production planning, quality control, supply chain management, 
              and equipment maintenance automation for manufacturing operations.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Production scheduling</li>
              <li>• Quality control checks</li>
              <li>• Supply chain optimization</li>
              <li>• Predictive maintenance</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-gray-800 mb-3">Education</h4>
            <p className="text-gray-600 mb-4">
              Student management, course scheduling, assessment automation, 
              and learning analytics for educational institutions.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Student enrollment</li>
              <li>• Course scheduling</li>
              <li>• Assessment grading</li>
              <li>• Learning analytics</li>
            </ul>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Transform Your Industry?
            </h3>
            <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
              Tredy AI adapts to your specific industry needs, creating intelligent workflows 
              that understand your business processes and automate complex tasks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-purple-600 px-8 py-3 rounded-xl font-semibold hover:bg-purple-50 transition-colors duration-300">
                Start Your Industry Solution
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white hover:text-purple-600 transition-colors duration-300">
                View All Industries
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}