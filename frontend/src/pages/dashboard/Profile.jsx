import { Camera, Lock, Mail, Save, User } from 'lucide-react';

export default function Profile() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900 mb-2">Profile Settings</h1>
        <p className="text-gray-600 text-lg">Manage your account information and preferences</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Picture */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Photo</h2>
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-5xl font-black shadow-xl">
                  J
                </div>
                <button className="absolute bottom-0 right-0 w-10 h-10 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-lg">
                  <Camera size={18} className="text-gray-600" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">JPG, GIF or PNG. Max size of 2MB</p>
              <button className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-200">
                Upload Photo
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
            <h3 className="text-lg font-bold mb-4">Account Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-purple-100">Member Since</span>
                <span className="font-bold">Jan 2026</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-100">Domains</span>
                <span className="font-bold">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-100">Total Spent</span>
                <span className="font-bold">$0.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <User size={20} className="text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  placeholder="John"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  placeholder="Doe"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  placeholder="+1 (234) 567-890"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Company</label>
                <input
                  type="text"
                  placeholder="Acme Inc."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2">
                <Save size={20} />
                Save Changes
              </button>
              <button className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-200">
                Cancel
              </button>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <Lock size={20} className="text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Security</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all duration-200"
                />
              </div>
              <button className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2">
                <Lock size={20} />
                Update Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
