import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Calendar, Users, Award, Star, ArrowRight, CheckCircle, TrendingUp, Shield, Heart } from 'lucide-react';

const Home = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, isHovered: false });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y, isHovered: true });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0, isHovered: false });
  };
  const features = [
    {
      icon: Calendar,
      title: 'Find Event Opportunities',
      description: 'Discover thousands of events that match your skills and interests. From conferences to festivals, find your next opportunity.',
    },
    {
      icon: Users,
      title: 'Connect With Teams',
      description: 'Build your network with event professionals worldwide. Collaborate with organizers, staff, and other professionals.',
    },
    {
      icon: Award,
      title: 'Build Your Experience',
      description: 'Gain valuable experience and grow your portfolio. Work on diverse events and enhance your professional profile.',
    },
    {
      icon: Star,
      title: 'Get Recognized',
      description: 'Showcase your work and build your reputation. Receive reviews and ratings from event organizers.',
    },
  ];

  const stats = [
    { value: '10,000+', label: 'Event Professionals' },
    { value: '500+', label: 'Events Listed' },
    { value: '20+', label: 'Cities Covered' },
    { value: '95%', label: 'Satisfaction Rate' },
  ];

  const roles = [
    {
      title: 'Administrators',
      description: 'Manage and coordinate your events',
      icon: Calendar,
    },
    {
      title: 'Volunteers',
      description: 'Contribute to causes you care about',
      icon: Heart,
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Event Coordinator',
      content: 'CrewLink has transformed how I find event staff. The quality of professionals is exceptional, and the platform is incredibly easy to use.',
      avatar: 'SJ',
    },
    {
      name: 'Michael Chen',
      role: 'Volunteer',
      content: 'I found amazing volunteer opportunities through CrewLink. It helped me build my experience and connect with like-minded people.',
      avatar: 'MC',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Photographer',
      content: 'As a photographer, CrewLink opened doors to incredible events. The platform makes it easy to showcase my work and get hired.',
      avatar: 'ER',
    },
  ];

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-transparent">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-14 items-center">

            {/* Left Column - Hero Content */}
            <div className="lg:col-span-6 animate-slide-up relative z-10">
              <div className="flex items-center space-x-3.5 mb-7 animate-fade-in group cursor-pointer">
                {/* Custom 3D Logo */}
                <svg 
                  viewBox="0 0 100 60" 
                  className="w-14 h-9 transform group-hover:scale-105 transition-all duration-300 drop-shadow-md"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="50%" stopColor="#f8fafc" />
                      <stop offset="100%" stopColor="#cbd5e1" />
                    </linearGradient>
                    <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#c084fc" />
                      <stop offset="100%" stopColor="#7e22ce" />
                    </linearGradient>
                    <clipPath id="clipTopLeft">
                      <rect x="0" y="0" width="60" height="30" />
                    </clipPath>
                    <filter id="bevel3D" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.2" result="dropShadow" />
                      <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
                      <feOffset dx="-1.5" dy="-1.5" result="offsetBlur" />
                      <feComposite in="SourceGraphic" in2="offsetBlur" operator="arithmetic" k2="1" k3="-1" result="highlightMask" />
                      <feFlood floodColor="white" floodOpacity="0.9" />
                      <feComposite in2="highlightMask" operator="in" result="highlight" />
                      <feOffset in="SourceAlpha" dx="2" dy="2" result="offsetBlur2" />
                      <feComposite in="SourceGraphic" in2="offsetBlur2" operator="arithmetic" k2="1" k3="-1" result="shadowMask" />
                      <feFlood floodColor="#000000" floodOpacity="0.5" />
                      <feComposite in2="shadowMask" operator="in" result="shadow" />
                      <feMerge>
                        <feMergeNode in="dropShadow" />
                        <feMergeNode in="SourceGraphic" />
                        <feMergeNode in="shadow" />
                        <feMergeNode in="highlight" />
                      </feMerge>
                    </filter>
                  </defs>
                  <rect x="12" y="10" width="46" height="40" rx="20" fill="none" stroke="url(#silverGrad)" strokeWidth="12" filter="url(#bevel3D)" />
                  <rect x="42" y="10" width="46" height="40" rx="20" fill="none" stroke="url(#purpleGrad)" strokeWidth="12" filter="url(#bevel3D)" />
                  <rect x="12" y="10" width="46" height="40" rx="20" fill="none" stroke="url(#silverGrad)" strokeWidth="12" clipPath="url(#clipTopLeft)" filter="url(#bevel3D)" />
                </svg>

                <span className="text-3xl sm:text-4xl font-black text-[#2563eb] tracking-tight drop-shadow-sm">
                  CrewLink
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-[1.1] tracking-tight font-serif">
                Great events start with the <span className="italic font-medium text-[#2563eb]">right crew.</span>
              </h1>
              <p className="text-lg lg:text-xl text-slate-600 mb-9 leading-relaxed font-normal max-w-xl">
                Connect. Collaborate. Create unforgettable events with the perfect team by your side.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link
                  to="/volunteer-register"
                  id="home-btn-volunteer"
                  data-testid="home-btn-volunteer"
                  className="w-full sm:w-auto btn-primary text-base px-8 py-3.5 flex items-center justify-center space-x-2"
                >
                  <span>Become a Volunteer</span>
                  <span className="text-lg leading-none">&rarr;</span>
                </Link>
                <Link
                  to="/login"
                  id="home-btn-login"
                  data-testid="home-btn-login"
                  className="w-full sm:w-auto btn-secondary text-base px-8 py-3.5 flex items-center justify-center space-x-2"
                >
                  <span>Login</span>
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-slate-700 font-medium">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="text-slate-600" size={18} />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="text-slate-600" size={18} />
                  <span>Free to join</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="text-slate-600" size={18} />
                  <span>Instant access</span>
                </div>
              </div>
            </div>

            {/* Right Column - Attractive 3D Event Multi-Photo Stack */}
            <div className="lg:col-span-6 relative pt-4 pb-12 animate-fade-in perspective-[1000px]">
              <div
                className="relative max-w-lg mx-auto transition-transform duration-500 ease-out"
                style={{
                  transform: mousePos.isHovered
                    ? `perspective(1000px) rotateY(${mousePos.x * 16}deg) rotateX(${-mousePos.y * 16}deg)`
                    : 'perspective(1000px) rotateY(-5deg) rotateX(2deg)',
                  transformStyle: 'preserve-3d'
                }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                {/* Glow effect behind */}
                <div className="absolute top-[15%] left-[10%] w-[80%] h-[70%] bg-blue-400/20 rounded-full blur-[100px] pointer-events-none" />

                {/* Main Attractive Image Stack with interactive fan-out on hover */}
                <div className="relative z-10 w-full h-[380px] sm:h-[420px] group cursor-pointer animate-float" style={{ animationDelay: '0s' }}>

                  {/* Card 3 (Bottom) - Social/Party Event */}
                  <div className="absolute inset-0 glass-panel rounded-3xl p-2.5 sm:p-3 shadow-premium transition-all duration-500 ease-out origin-bottom-right group-hover:rotate-[8deg] group-hover:translate-x-10 sm:group-hover:translate-x-14 group-hover:-translate-y-6 opacity-70 group-hover:opacity-100 z-0">
                    <div
                      className="w-full h-full rounded-2xl bg-cover bg-center shadow-inner relative overflow-hidden"
                      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80')" }}
                    >
                      <div className="absolute inset-0 bg-black/40 rounded-2xl group-hover:bg-black/20 transition-colors" />
                      <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/30">
                        Social Events
                      </div>
                    </div>
                  </div>

                  {/* Card 2 (Middle) - Corporate Event */}
                  <div className="absolute inset-0 glass-panel rounded-3xl p-2.5 sm:p-3 shadow-premium transition-all duration-500 ease-out origin-bottom-right group-hover:rotate-[4deg] group-hover:translate-x-5 sm:group-hover:translate-x-7 group-hover:-translate-y-3 opacity-85 group-hover:opacity-100 z-10">
                    <div
                      className="w-full h-full rounded-2xl bg-cover bg-center shadow-inner relative overflow-hidden"
                      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?w=800&q=80')" }}
                    >
                      <div className="absolute inset-0 bg-black/30 rounded-2xl group-hover:bg-black/10 transition-colors" />
                      <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/30">
                        Corporate Events
                      </div>
                    </div>
                  </div>

                  {/* Card 1 (Top/Main) - Live Experience */}
                  <div className="absolute inset-0 glass-panel rounded-3xl p-2.5 sm:p-3 shadow-premium transition-all duration-500 ease-out z-20 group-hover:-translate-x-3 sm:group-hover:-translate-x-4 group-hover:-rotate-2">
                    <div
                      className="w-full h-full rounded-2xl bg-cover bg-center shadow-inner relative overflow-hidden"
                      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80')" }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-5 sm:p-6">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-600 text-white backdrop-blur-md mb-2 w-max shadow-md">
                          Live Experience
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-md">Unforgettable Events</h3>
                        <p className="text-white/80 text-xs sm:text-sm font-medium">Powered by the perfect crew</p>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Second Overlapping Photo - Venue/Conference Hall */}
                <div className="absolute -bottom-8 -right-3 sm:-bottom-10 sm:-right-6 z-30 animate-float" style={{ animationDelay: '1s' }}>
                  <div className="glass-panel p-2 rounded-2xl shadow-2xl -rotate-3 hover:rotate-0 transition-transform duration-500 border border-slate-200/80">
                    <img
                      src="https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&q=80"
                      alt="Event Planning & Venue"
                      className="w-36 h-36 sm:w-44 sm:h-44 rounded-xl object-cover"
                    />
                  </div>
                </div>

                {/* Secondary Floating Badge 1 - Satisfaction */}
                <div className="absolute -bottom-5 -left-4 sm:-bottom-6 sm:-left-8 z-40 glass-panel rounded-2xl p-3 sm:p-4 shadow-premium animate-float flex items-center space-x-3 sm:space-x-4 border border-slate-200/90" style={{ animationDelay: '1.5s' }}>
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 flex-shrink-0">
                    <TrendingUp size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Satisfaction</p>
                    <p className="text-lg sm:text-xl font-black text-slate-900 leading-tight">High</p>
                  </div>
                </div>

                {/* Secondary Floating Badge 2 - Pros */}
                <div className="absolute -top-4 -right-2 sm:-top-6 sm:-right-8 z-40 glass-panel rounded-2xl px-4 py-2.5 sm:py-3 shadow-premium animate-float flex items-center space-x-3 border border-slate-200/90" style={{ animationDelay: '3s' }}>
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 flex-shrink-0">
                    <Shield size={18} />
                  </div>
                  <p className="text-sm sm:text-base font-bold text-slate-900">Verified Pros</p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="text-4xl lg:text-5xl font-semibold text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="how-it-works" className="py-20 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl mb-16 animate-slide-up">
            <h2 className="text-3xl lg:text-4xl font-semibold text-gray-900 mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-lg text-gray-600">
              Whether you're an organizer or a professional, CrewLink provides all the tools you need.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="card-minimal text-center animate-slide-up" style={{ animationDelay: `${(index + 4) * 100}ms` }}>
                  <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <Icon className="text-gray-900" size={28} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl mb-16 animate-slide-up">
            <h2 className="text-3xl lg:text-4xl font-semibold text-gray-900 mb-4">
              Join as your role
            </h2>
            <p className="text-lg text-gray-600">
              CrewLink serves everyone in the event industry
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map((role, index) => {
              const Icon = role.icon;
              return (
                <div
                  key={role.title}
                  className="card-minimal animate-slide-up"
                  style={{ animationDelay: `${(index + 8) * 100}ms` }}
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="text-gray-900" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {role.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{role.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl mb-16 animate-slide-up">
            <h2 className="text-3xl lg:text-4xl font-semibold text-gray-900 mb-4">
              Loved by event professionals
            </h2>
            <p className="text-lg text-gray-600">
              See what our community has to say about CrewLink
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={testimonial.name} className="card-minimal animate-slide-up" style={{ animationDelay: `${(index + 12) * 100}ms` }}>
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="text-yellow-500 fill-current" size={16} />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">{testimonial.name}</p>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-transparent">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center animate-slide-up">
          <h2 className="text-3xl lg:text-4xl font-semibold text-gray-900 mb-4">
            Ready to join the crew?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Start connecting with event opportunities today. It's free to get started.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/volunteer-register"
              id="home-cta-volunteer"
              data-testid="home-cta-volunteer"
              className="w-full sm:w-auto btn-primary text-lg px-8 py-4 flex items-center justify-center space-x-2"
            >
              <span>Volunteer Sign Up</span>
              <ArrowRight size={20} />
            </Link>
            <Link
              to="/login"
              id="home-cta-login"
              data-testid="home-cta-login"
              className="w-full sm:w-auto btn-secondary text-lg px-8 py-4"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-panel border-t border-gray-200/50 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">C</span>
                </div>
                <span className="text-xl font-semibold text-gray-900">CrewLink</span>
              </div>
              <p className="text-gray-600 text-sm">
                Great events start with the right crew.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/events" className="hover:text-gray-900 transition-colors">Events</Link></li>
                <li><Link to="/about" className="hover:text-gray-900 transition-colors">About Us</Link></li>
                <li><Link to="/pricing" className="hover:text-gray-900 transition-colors">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/help" className="hover:text-gray-900 transition-colors">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-gray-900 transition-colors">Contact Us</Link></li>
                <li><Link to="/faq" className="hover:text-gray-900 transition-colors">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/privacy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-gray-900 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-600">
            <p>&copy; 2024 CrewLink. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;


