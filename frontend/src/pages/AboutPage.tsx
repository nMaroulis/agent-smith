import { FiGithub, FiCode, FiCpu, FiLayers, FiZap, FiTwitter } from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function AboutPage() {
  const features = [
    {
      icon: <FiCpu className="w-8 h-8 text-blue-400" />,
      title: "Powerful AI Integration",
      description: "Seamlessly connect with multiple AI providers including OpenAI, Anthropic, and local LLaMA models. Our platform supports the latest models for text generation, reasoning, and more."
    },
    {
      icon: <FiLayers className="w-8 h-8 text-purple-400" />,
      title: "Visual Workflow Builder",
      description: "Create complex AI workflows with our intuitive drag-and-drop interface. Chain multiple models, tools, and data sources together without writing a single line of code."
    },
    {
      icon: <FiCode className="w-8 h-8 text-green-400" />,
      title: "Custom Functions",
      description: "Extend functionality with custom JavaScript/TypeScript functions. Add your own logic, API calls, and data processing steps to create truly unique AI applications."
    },
    {
      icon: <FiZap className="w-8 h-8 text-yellow-400" />,
      title: "Real-time Execution",
      description: "See your AI workflows execute in real-time with detailed logging and monitoring. Debug and optimize your prompts and function calls with ease."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Welcome to Agent Smith
              </h1>
              <p className="mt-6 text-xl text-gray-300 max-w-3xl mx-auto">
                The ultimate platform for building, managing, and deploying AI workflows with ease. 
                Empower your applications with cutting-edge AI capabilities through our intuitive interface.
              </p>
            </motion.div>
          </div>
        </div>
        <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:linear-gradient(to_bottom,transparent,black_70%)]"></div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold mb-8">Why Choose Agent Smith?</h2>
            <p className="text-gray-400 mb-8 text-lg">
              Our platform is designed to make AI accessible to everyone, from developers to business users. 
              With powerful features and an intuitive interface, you can focus on building amazing AI applications 
              without worrying about infrastructure or complex integrations.
            </p>
            
            <div className="space-y-8">
              {features.map((feature, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0">
                    <div className="p-2 bg-gray-800 rounded-lg">
                      {feature.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                    <p className="mt-1 text-gray-400">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <div className="sticky top-24">
              <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="text-6xl mb-4">🚀</div>
                    <h3 className="text-2xl font-bold">Visual AI Workflow Builder</h3>
                    <p className="text-gray-400 mt-2">Create complex AI workflows with ease</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-70"></div>
              </div>
              
              <div className="mt-8 p-6 bg-gray-800 rounded-xl border border-gray-700">
                <h3 className="text-xl font-semibold mb-4">Get Started</h3>
                <p className="text-gray-400 mb-4">
                  Ready to build your first AI workflow? Head over to the Canvas to get started, 
                  or explore our documentation for tutorials and examples.
                </p>
                <div className="flex gap-3">
                  <a 
                    href="/" 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Go to Canvas
                  </a>
                  <a 
                    href="https://github.com/your-repo/docs" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-2 border border-gray-600 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <FiGithub /> Documentation
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-gray-800/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Our Mission</h2>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xl text-gray-300 mb-8">
              At Agent Smith, we believe in democratizing AI development. Our mission is to provide 
              powerful yet accessible tools that enable anyone to harness the power of artificial 
              intelligence, regardless of their technical background.
            </p>
            <p className="text-gray-400">
              Join our growing community of developers, researchers, and AI enthusiasts who are 
              building the future of intelligent applications.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900/80 border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
                Agent Smith
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Empowering developers and businesses to build, deploy, and manage intelligent agents at scale.
              </p>
              <div className="flex space-x-4">
                <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer" 
                   className="text-gray-400 hover:text-white transition-colors">
                  <FiGithub className="w-5 h-5" />
                </a>
                <a href="https://twitter.com/yourhandle" target="_blank" rel="noopener noreferrer" 
                   className="text-gray-400 hover:text-blue-400 transition-colors">
                  <FiTwitter className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="/" className="text-gray-400 hover:text-white text-sm transition-colors">Home</a></li>
                <li><a href="/llms" className="text-gray-400 hover:text-white text-sm transition-colors">LLMs</a></li>
                <li><a href="/functions" className="text-gray-400 hover:text-white text-sm transition-colors">Functions</a></li>
                <li><a href="/about" className="text-gray-400 hover:text-white text-sm transition-colors">About</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">API Reference</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Tutorials</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Blog</a></li>
              </ul>
            </div>
          </div>

          {/* Copyright and Legal */}
          <div className="mt-12 pt-8 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-500 text-sm">
                © {new Date().getFullYear()} Agent Smith. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-500 hover:text-white text-xs transition-colors">Privacy Policy</a>
                <a href="#" className="text-gray-500 hover:text-white text-xs transition-colors">Terms of Service</a>
                <a href="#" className="text-gray-500 hover:text-white text-xs transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
