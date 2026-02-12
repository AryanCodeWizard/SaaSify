import { ArrowLeft, Check, Cloud, Server } from 'lucide-react';
import { createDynamicHosting, createStaticHosting } from '../../services/hostingService';

import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const CreateHosting = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Choose Type, 2: Configure
  const [hostingType, setHostingType] = useState(null);
  const [loading, setLoading] = useState(false);

  // Static hosting form state
  const [staticForm, setStaticForm] = useState({
    domainName: '',
    plan: 'basic'
  });

  // Dynamic hosting form state
  const [dynamicForm, setDynamicForm] = useState({
    domainName: '',
    instanceType: 't2.micro',
    runtime: 'nodejs',
    enableDatabase: false,
    databaseEngine: 'mysql',
    databaseInstanceClass: 'db.t3.micro'
  });

  const handleTypeSelect = (type) => {
    setHostingType(type);
    setStep(2);
  };

  const handleStaticSubmit = async (e) => {
    e.preventDefault();
    
    if (!staticForm.domainName) {
      toast.error('Please enter a domain name');
      return;
    }

    try {
      setLoading(true);
      const response = await createStaticHosting({
        domainName: staticForm.domainName,
        plan: {
          name: staticForm.plan === 'basic' ? 'Basic Static' : 'Pro Static',
          price: staticForm.plan === 'basic' ? 5 : 15,
          billingCycle: 'monthly'
        }
      });

      toast.success('Static hosting service created! Provisioning in progress...');
      navigate(`/dashboard/hosting/static/${response.data._id}`);
    } catch (error) {
      console.error('Error creating static hosting:', error);
      toast.error(error.response?.data?.message || 'Failed to create hosting service');
    } finally {
      setLoading(false);
    }
  };

  const handleDynamicSubmit = async (e) => {
    e.preventDefault();

    if (!dynamicForm.domainName) {
      toast.error('Please enter a domain name');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        domainName: dynamicForm.domainName,
        instanceType: dynamicForm.instanceType,
        runtime: dynamicForm.runtime,
        plan: {
          name: `${dynamicForm.instanceType} Instance`,
          price: dynamicForm.instanceType === 't2.micro' ? 10 : dynamicForm.instanceType === 't2.small' ? 20 : 40,
          billingCycle: 'monthly'
        }
      };

      if (dynamicForm.enableDatabase) {
        payload.database = {
          enabled: true,
          engine: dynamicForm.databaseEngine,
          instanceClass: dynamicForm.databaseInstanceClass,
          name: dynamicForm.domainName.replace(/\./g, '_') + '_db'
        };
      }

      const response = await createDynamicHosting(payload);
      toast.success('Dynamic hosting service created! Provisioning in progress...');
      navigate(`/dashboard/hosting/dynamic/${response.data._id}`);
    } catch (error) {
      console.error('Error creating dynamic hosting:', error);
      toast.error(error.response?.data?.message || 'Failed to create hosting service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => step === 1 ? navigate('/dashboard/hosting') : setStep(1)}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Create Hosting Service</h1>
        <p className="mt-2 text-sm text-gray-600">
          Set up a new hosting service for your website or application
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center">
          <div className={`flex items-center ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              step >= 1 ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300'
            }`}>
              {step > 1 ? <Check className="w-5 h-5" /> : '1'}
            </div>
            <span className="ml-2 text-sm font-medium">Choose Type</span>
          </div>
          <div className={`flex-1 h-0.5 mx-4 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              step >= 2 ? 'border-indigo-600' : 'border-gray-300'
            }`}>
              2
            </div>
            <span className="ml-2 text-sm font-medium">Configure</span>
          </div>
        </div>
      </div>

      {/* Step 1: Choose Type */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Static Hosting Card */}
          <button
            onClick={() => handleTypeSelect('static')}
            className="bg-white p-8 rounded-lg shadow-lg border-2 border-gray-200 hover:border-indigo-500 transition-all text-left"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-lg mb-4">
              <Cloud className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Static Hosting</h3>
            <p className="text-gray-600 mb-4">
              Perfect for static websites built with HTML, CSS, JavaScript, React, Vue, etc.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                S3 Storage
              </li>
              <li className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                CloudFront CDN
              </li>
              <li className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                SSL Certificate
              </li>
              <li className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                Custom Domain
              </li>
            </ul>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">Starting at</p>
              <p className="text-2xl font-bold text-gray-900">$5<span className="text-sm font-normal text-gray-500">/month</span></p>
            </div>
          </button>

          {/* Dynamic Hosting Card */}
          <button
            onClick={() => handleTypeSelect('dynamic')}
            className="bg-white p-8 rounded-lg shadow-lg border-2 border-gray-200 hover:border-indigo-500 transition-all text-left"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-lg mb-4">
              <Server className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Dynamic Hosting</h3>
            <p className="text-gray-600 mb-4">
              Full EC2 server for Node.js, Python, PHP, Ruby applications with optional database.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                EC2 Instance
              </li>
              <li className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                SSH Access
              </li>
              <li className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                Optional RDS Database
              </li>
              <li className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                Docker Pre-installed
              </li>
            </ul>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">Starting at</p>
              <p className="text-2xl font-bold text-gray-900">$10<span className="text-sm font-normal text-gray-500">/month</span></p>
            </div>
          </button>
        </div>
      )}

      {/* Step 2: Configure Static Hosting */}
      {step === 2 && hostingType === 'static' && (
        <div className="bg-white shadow rounded-lg p-8">
          <form onSubmit={handleStaticSubmit} className="space-y-6">
            <div>
              <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-2">
                Domain Name *
              </label>
              <input
                type="text"
                id="domain"
                value={staticForm.domainName}
                onChange={(e) => setStaticForm({ ...staticForm, domainName: e.target.value })}
                placeholder="example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the domain name you want to use for this hosting service
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">Select Plan</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setStaticForm({ ...staticForm, plan: 'basic' })}
                  className={`p-4 border-2 rounded-lg text-left ${
                    staticForm.plan === 'basic'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Basic</h4>
                    <span className="text-lg font-bold text-gray-900">$5/mo</span>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 10 GB Storage</li>
                    <li>• 50 GB Bandwidth</li>
                    <li>• SSL Certificate</li>
                  </ul>
                </button>

                <button
                  type="button"
                  onClick={() => setStaticForm({ ...staticForm, plan: 'pro' })}
                  className={`p-4 border-2 rounded-lg text-left ${
                    staticForm.plan === 'pro'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Pro</h4>
                    <span className="text-lg font-bold text-gray-900">$15/mo</span>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 50 GB Storage</li>
                    <li>• 200 GB Bandwidth</li>
                    <li>• SSL Certificate</li>
                  </ul>
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Static Hosting'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 2: Configure Dynamic Hosting */}
      {step === 2 && hostingType === 'dynamic' && (
        <div className="bg-white shadow rounded-lg p-8">
          <form onSubmit={handleDynamicSubmit} className="space-y-6">
            <div>
              <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-2">
                Domain Name *
              </label>
              <input
                type="text"
                id="domain"
                value={dynamicForm.domainName}
                onChange={(e) => setDynamicForm({ ...dynamicForm, domainName: e.target.value })}
                placeholder="example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor="instanceType" className="block text-sm font-medium text-gray-700 mb-2">
                Instance Type *
              </label>
              <select
                id="instanceType"
                value={dynamicForm.instanceType}
                onChange={(e) => setDynamicForm({ ...dynamicForm, instanceType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="t2.micro">t2.micro (1 vCPU, 1 GB RAM) - $10/mo</option>
                <option value="t2.small">t2.small (1 vCPU, 2 GB RAM) - $20/mo</option>
                <option value="t2.medium">t2.medium (2 vCPU, 4 GB RAM) - $40/mo</option>
              </select>
            </div>

            <div>
              <label htmlFor="runtime" className="block text-sm font-medium text-gray-700 mb-2">
                Runtime Environment *
              </label>
              <select
                id="runtime"
                value={dynamicForm.runtime}
                onChange={(e) => setDynamicForm({ ...dynamicForm, runtime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="nodejs">Node.js</option>
                <option value="python">Python</option>
                <option value="php">PHP</option>
                <option value="ruby">Ruby</option>
              </select>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="enableDatabase"
                  checked={dynamicForm.enableDatabase}
                  onChange={(e) => setDynamicForm({ ...dynamicForm, enableDatabase: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="enableDatabase" className="ml-2 block text-sm font-medium text-gray-700">
                  Add Database (RDS)
                </label>
              </div>

              {dynamicForm.enableDatabase && (
                <div className="ml-6 space-y-4">
                  <div>
                    <label htmlFor="dbEngine" className="block text-sm font-medium text-gray-700 mb-2">
                      Database Engine
                    </label>
                    <select
                      id="dbEngine"
                      value={dynamicForm.databaseEngine}
                      onChange={(e) => setDynamicForm({ ...dynamicForm, databaseEngine: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="mysql">MySQL</option>
                      <option value="postgres">PostgreSQL</option>
                      <option value="mariadb">MariaDB</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="dbInstance" className="block text-sm font-medium text-gray-700 mb-2">
                      Database Instance Class
                    </label>
                    <select
                      id="dbInstance"
                      value={dynamicForm.databaseInstanceClass}
                      onChange={(e) => setDynamicForm({ ...dynamicForm, databaseInstanceClass: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="db.t3.micro">db.t3.micro (1 vCPU, 1 GB) - +$15/mo</option>
                      <option value="db.t3.small">db.t3.small (2 vCPU, 2 GB) - +$30/mo</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Your server will be provisioned with Docker pre-installed. 
                You'll receive SSH credentials once the setup is complete (usually 5-10 minutes).
              </p>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Dynamic Hosting'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CreateHosting;
