import React from 'react';
import { ArrowLeft, Home, User, Search, LayoutDashboard, Calendar, DollarSign, GraduationCap, Users, FileText } from 'lucide-react';

const ThemeDemo = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-xl font-semibold">ERP System</span>
          </div>
          <nav className="flex items-center gap-6">
            <button className="flex items-center gap-2 hover:text-gray-300 transition">
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
            <button className="flex items-center gap-2 hover:text-gray-300 transition">
              <User className="w-4 h-4" />
              <span>Profile</span>
            </button>
            <button className="flex items-center gap-2 hover:text-gray-300 transition">
              <Search className="w-4 h-4" />
              <span>Find Resources</span>
            </button>
            <button className="flex items-center gap-2 hover:text-gray-300 transition">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Button */}
        <button className="mb-6 bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-700 transition">
          <ArrowLeft className="w-4 h-4" />
          Back to Resources
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Card */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-lg p-6 shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Department Resource Allocation</h1>
                  <p className="text-gray-300">Operations & Management Division</p>
                </div>
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Active
                </span>
              </div>
              <p className="text-gray-200 leading-relaxed">
                Comprehensive resource management for department operations. This module ensures efficient allocation 
                and tracking of resources across all organizational units.
              </p>
            </div>

            {/* Info Cards Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-6 shadow">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <DollarSign className="w-5 h-5" />
                  <span className="text-sm font-medium">Budget Allocated</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">₹50,000</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm font-medium">Review Period</span>
                </div>
                <p className="text-xl font-bold text-gray-900">15 Jan 2026 - 15 Apr 2026</p>
                <p className="text-sm text-gray-500 mt-1">70 days remaining</p>
              </div>
            </div>

            {/* Eligibility Criteria */}
            <div className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-gray-600">🛡️</span>
                Eligibility Criteria
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Department Level</p>
                    <p className="font-semibold text-gray-900">Operations</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Minimum Team Size</p>
                    <p className="font-semibold text-gray-900">5 Members</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Max Budget Limit</p>
                    <p className="font-semibold text-gray-900">₹2,50,000</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Categories</p>
                    <p className="font-semibold text-gray-900">IT, HR, Finance</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600 mb-1">📋 Applicable Fields</p>
                <p className="font-medium text-gray-900">Open to all departments</p>
              </div>
            </div>

            {/* Required Documents */}
            <div className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Required Documents
              </h2>
              <div className="border-l-4 border-gray-300 pl-4 space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">📄 Department Report</h3>
                  <p className="text-sm text-gray-600 mb-2">Official document showing department performance.</p>
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-1">How to obtain:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>Request from department head</li>
                      <li>Download from internal portal</li>
                      <li>Submit original copy if required</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Match Score Card */}
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                📊 Your Match Score
              </h3>
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                    <circle cx="64" cy="64" r="56" stroke="#4b5563" strokeWidth="8" fill="none"
                      strokeDasharray="351.86" strokeDashoffset="35.186" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-bold text-gray-900">95</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">out of 100</p>
              </div>

              {/* Score Breakdown */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Category</span>
                    <span className="font-semibold text-gray-900">25/25</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{width: '100%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Department Level</span>
                    <span className="font-semibold text-gray-900">20/20</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{width: '100%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Performance</span>
                    <span className="font-semibold text-gray-900">20/20</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{width: '100%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Budget</span>
                    <span className="font-semibold text-gray-900">20/20</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{width: '100%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Team Size</span>
                    <span className="font-semibold text-gray-900">10/15</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gray-800 h-2 rounded-full" style={{width: '67%'}}></div>
                  </div>
                </div>
              </div>

              {/* Eligibility Checklist */}
              <div className="mt-6 pt-6 border-t space-y-2 text-sm">
                <p className="text-green-600">✓ Your category is eligible</p>
                <p className="text-green-600">✓ Your department level meets requirement</p>
                <p className="text-green-600">✓ Your performance meets the requirement</p>
                <p className="text-green-600">✓ Your budget is within limit</p>
                <p className="text-gray-600">✓ Open to all departments</p>
              </div>
            </div>

            {/* Action Card */}
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                ✈️ Apply Now
              </h3>
              <button className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition mb-4">
                🔗 Apply on Official Portal
              </button>
              <div className="text-center text-sm text-gray-500 mb-4">OR TRACK HERE</div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Username</label>
                <input 
                  type="text" 
                  placeholder="username" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
              <button className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition">
                🚀 Start & Track Application
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeDemo;
