import { useState, useEffect } from 'react';
import { FiGithub, FiCode, FiCpu, FiLayers, FiZap, FiTwitter, FiLinkedin } from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function AboutPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = ['mission', 'team', 'values'];

  const nextSlide = () => {
    setCurrentSlide((prev: number) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev: number) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Auto-advance slides every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 8000);
    return () => clearInterval(timer);
  }, []);

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
      title: "Custom Tools",
      description: "Extend functionality with custom python tools. Add your own logic, API calls, and data processing steps to create truly unique AI applications."
    },
    {
      icon: <FiZap className="w-8 h-8 text-yellow-400" />,
      title: "Real-time Execution",
      description: "See your AI workflows execute in real-time with detailed logging and monitoring. Debug and optimize your prompts and tool calls with ease."
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

      {/* Carousel Section */}
      <div className="relative bg-gray-800/50 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="relative">
            {/* Carousel Content */}
            <div className="relative min-h-[36rem] overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl">

              {/* Team Slide */}
              <motion.div 
                className="absolute inset-0 p-6 md:p-8 flex flex-col justify-center bg-gray-800"
                initial={{ opacity: 0, x: '100%' }}
                animate={{ 
                  opacity: currentSlide === 0 ? 1 : 0,
                  x: currentSlide === 0 ? 0 : currentSlide > 0 ? '-100%' : '100%',
                  transition: { duration: 0.5, ease: 'easeInOut' }
                }}
              >
                <h2 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                  The Team (Mostly Just Me)
                </h2>
                <div className="flex justify-center">
                  <div className="text-center p-8 bg-gray-700/50 rounded-xl hover:bg-gray-700/70 transition-colors w-full max-w-md">
                    <div className="w-40 h-40 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                      <img 
                        src="https://media.licdn.com/dms/image/v2/C5603AQF9zWb-9L8ApQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1627247306694?e=1756339200&v=beta&t=IA9rtv_Lkl9EYp5LcB2GZlJNJ2pcjAgGkJOvu-HGtsw" 
                        alt="Nikolaos Maroulis"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = '#';
                          target.parentElement!.innerHTML = '<div class="text-4xl">👋</div>';
                        }}
                      />
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-2">Nikolaos Maroulis</h3>
                    <p className="text-purple-300 mb-4">AI Engineer</p>
                    <p className="text-gray-300 mb-6">
                      Building cool stuff, one line of code at a time.
                    </p>
                    <div className="flex justify-center space-x-4 mb-2">
                      <a 
                        href="https://github.com/nmaroulis" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-300 hover:text-white transition-colors"
                        aria-label="GitHub Profile"
                      >
                        <FiGithub className="w-5 h-5" />
                      </a>
                      <a 
                        href="https://linkedin.com/in/nikos-maroulis" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-300 hover:text-blue-400 transition-colors"
                        aria-label="LinkedIn Profile"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </a>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                      P.S. I'm open to collaborators! Check out our GitHub if you're interested.
                    </p>
                  </div>
                </div>
              </motion.div>
              
              {/* Mission Slide */}
              <motion.div 
                className="absolute inset-0 p-8 md:p-12 flex flex-col justify-center"
                initial={{ opacity: 0, x: '100%' }}
                animate={{ 
                  opacity: currentSlide === 1 ? 1 : 0,
                  x: currentSlide === 1 ? 0 : currentSlide > 1 ? '-100%' : '100%',
                  transition: { duration: 0.5, ease: 'easeInOut' }
                }}
              >
                <h2 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                  Our Mission
                </h2>
                <div className="max-w-3xl mx-auto px-6 text-center">
                  <p className="text-xl leading-relaxed text-gray-300 mb-8">
                    Agent Smith is an open-source project with a simple goal: to provide developers with 
                    a flexible, no-nonsense platform for building and managing AI workflows. We believe in 
                    practical solutions over buzzwords, and we're building tools we actually want to use.
                  </p>
                  <p className="text-xl text-gray-300 italic">
                    "Less hype, more building."
                  </p>
                </div>
              </motion.div>


              {/* Values Slide */}
              <motion.div 
                className="absolute inset-0 p-8 md:p-12 flex flex-col justify-center bg-gray-900"
                initial={{ opacity: 0, x: '100%' }}
                animate={{ 
                  opacity: currentSlide === 2 ? 1 : 0,
                  x: currentSlide === 2 ? 0 : currentSlide > 2 ? '-100%' : '100%',
                  transition: { duration: 0.5, ease: 'easeInOut' }
                }}
              >
                <h2 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500">
                  What We Stand For
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  {[
                    { 
                      icon: '💻', 
                      title: 'Code First', 
                      description: 'We believe in working code over fancy presentations. If it works, ship it.' 
                    },
                    { 
                      icon: '🌱', 
                      title: 'Keep It Simple', 
                      description: 'Complexity is the enemy. We aim for the simplest solution that works.' 
                    },
                    { 
                      icon: '🤝', 
                      title: 'Community Driven', 
                      description: 'Good ideas can come from anywhere. We value contributions from everyone.' 
                    },
                    { 
                      icon: '🐛', 
                      title: 'Embrace Imperfection', 
                      description: 'We ship, iterate, and improve. Perfect is the enemy of done.' 
                    },
                    { 
                      icon: '📚', 
                      title: 'Documentation Matters', 
                      description: 'Code isn\'t done until it\'s documented. (We try our best, at least)' 
                    },
                    { 
                      icon: '☕', 
                      title: 'Caffeine Fueled', 
                      description: 'Built with copious amounts of coffee and late-night coding sessions.' 
                    }
                  ].map((value, idx) => (
                    <div key={idx} className="p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800/70 transition-colors">
                      <div className="text-3xl mb-3">{value.icon}</div>
                      <h3 className="text-lg font-semibold text-white mb-1">{value.title}</h3>
                      <p className="text-sm text-gray-300">{value.description}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center mt-8 space-x-2">
              {['Mission', 'Team', 'Values'].map((item, idx) => (
                <button 
                  key={idx}
                  onClick={() => goToSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentSlide === idx 
                      ? 'bg-gradient-to-r from-blue-400 to-purple-500 w-8' 
                      : 'bg-gray-600 hover:bg-gray-500 w-3'
                  }`}
                  aria-label={`Go to ${item} slide`}
                />
              ))}
            </div>

            {/* Navigation Arrows */}
            <button 
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-gray-900/50 hover:bg-gray-800/80 text-white p-3 rounded-full backdrop-blur-sm transition-all hover:scale-110"
              aria-label="Previous slide"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-900/50 hover:bg-gray-800/80 text-white p-3 rounded-full backdrop-blur-sm transition-all hover:scale-110"
              aria-label="Next slide"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
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
                <a href="https://github.com/nMaroulis/agent-smith" target="_blank" rel="noopener noreferrer" 
                   className="text-gray-400 hover:text-white transition-colors">
                  <FiGithub className="w-5 h-5" />
                </a>
                <a href="https://linkedin.com/in/nikos-maroulis" target="_blank" rel="noopener noreferrer" 
                   className="text-gray-400 hover:text-blue-400 transition-colors">
                  <FiLinkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="/" className="text-gray-400 hover:text-white text-sm transition-colors">Home</a></li>
                <li><a href="/llms" className="text-gray-400 hover:text-white text-sm transition-colors">LLMs</a></li>
                <li><a href="/tools" className="text-gray-400 hover:text-white text-sm transition-colors">Tools</a></li>
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
