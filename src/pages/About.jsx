import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { 
  Users, 
  Award, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  Calendar, 
  TrendingUp, 
  Heart, 
  Mic, 
  Camera, 
  Clock, 
  ArrowRight, 
  Briefcase, 
  Radio, 
  Zap, 
  Star,
  MapPin,
  Smile
} from 'lucide-react';

const About = () => {
  const [activeTab, setActiveTab] = useState('all');

  const workCategories = [
    {
      id: 'operations',
      title: 'Ground & Venue Operations',
      icon: Briefcase,
      tag: 'Logistics',
      color: 'from-blue-500/10 to-indigo-500/10 text-blue-600',
      description: 'From crowd ushering and badge verification to entry gate management and parking logistics, our ground crew keeps events running without friction.',
      highlights: ['Seamless crowd flow control', 'Fast VIP check-ins & accreditation', 'Emergency response assistance'],
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80'
    },
    {
      id: 'production',
      title: 'Stage & Tech Production',
      icon: Radio,
      tag: 'Technical',
      color: 'from-purple-500/10 to-pink-500/10 text-purple-600',
      description: 'Backstage hands, AV technicians, sound engineers, and lighting rig runners supporting headline performers, keynote speakers, and live broadcasts.',
      highlights: ['Real-time walkie & voice dispatch', 'Green room & artist hospitality', 'Quick set transitions & AV checks'],
      image: '/stage-crew.png'
    },
    {
      id: 'guest',
      title: 'Hospitality & Guest Experience',
      icon: Heart,
      tag: 'Relations',
      color: 'from-pink-500/10 to-rose-500/10 text-pink-600',
      description: 'Warm, articulate, and proactive personnel handling help desks, sponsor booths, VIP lounges, and information counters with a smile.',
      highlights: ['Multilingual guest assistance', 'Sponsor brand ambassadors', 'Lost & found and helpdesk coverage'],
      image: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?w=800&q=80'
    },
    {
      id: 'verification',
      title: 'Live Task Verification & Proof',
      icon: Camera,
      tag: 'Innovation',
      color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600',
      description: 'Transparent operations powered by mobile technology. Every volunteer shift includes geo-located photo check-ins and live audio notes to ensure complete accountability.',
      highlights: ['Geo-tagged photo submissions', 'Direct voice notes between Admin & Crew', 'Guaranteed minimum ₹200/shift pay'],
      image: 'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?w=800&q=80'
    }
  ];

  const milestones = [
    { number: '500+', label: 'Events Staffed', detail: 'Across summits, concerts, expos & galas' },
    { number: '10,000+', label: 'Volunteer Hours', detail: 'Dedicated to unforgettable community experiences' },
    { number: '₹15L+', label: 'Disbursed Compensation', detail: 'Fair wages paid directly to students & crew' },
    { number: '99.4%', label: 'On-Time Crew Arrival', detail: 'Backed by live check-ins and dispatch' }
  ];

  const coreValues = [
    {
      icon: ShieldCheck,
      title: 'Transparency & Fair Pay',
      description: 'We believe event workers and volunteers deserve dignified compensation. Every single task comes with clear rates starting from ₹200+ with prompt payouts.'
    },
    {
      icon: Zap,
      title: 'Real-Time Operational Agility',
      description: 'Live voice notes, immediate task broadcasts, and push notifications keep organizers and crews on the exact same wavelength.'
    },
    {
      icon: Users,
      title: 'Community-Driven Growth',
      description: 'Volunteers build valuable resumes, gain real-world hospitality and production skills, and make career-defining connections.'
    },
    {
      icon: Star,
      title: 'Excellence in Execution',
      description: 'From 50-person executive roundtables to 10,000-attendee music festivals, our crew brings energy, poise, and relentless dedication.'
    }
  ];

  const pastWorkHighlights = [
    {
      title: 'Global Tech Innovation Summit 2025',
      category: 'Tech Conference',
      volunteers: '45 Crew Members',
      location: 'HITEX Exhibition Center, Hyderabad',
      achievement: 'Zero queue delays for 4,200 delegates with synchronized badge verification.',
      image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80'
    },
    {
      title: 'Vibrant Pulse Music Festival',
      category: 'Concert & Festival',
      volunteers: '60 Crew Members',
      location: 'Gachibowli Stadium',
      achievement: 'Managed backstage security, artist hospitality, and merchandise stalls for 12,000 music fans.',
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80'
    },
    {
      title: 'National Startup Expo & Pitch Fest',
      category: 'Exhibition & Networking',
      volunteers: '30 Crew Members',
      location: 'HICC Convention Hall',
      achievement: 'Coordinated 180 exhibitor booths and stage transitions with real-time mobile tracking.',
      image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&q=80'
    }
  ];

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto animate-slide-up">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200/60 mb-6 shadow-sm">
              <Sparkles className="text-purple-600" size={16} />
              <span className="text-xs font-semibold text-purple-700 tracking-wide uppercase">
                About CrewLink & Our Work
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
              The Engine Behind <br />
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Exceptional Events
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-8 font-normal">
              CrewLink is an intelligent event workforce platform connecting organizers with enthusiastic, verified volunteers and skilled production crew. We streamline shifts, ensure live operational tracking, and guarantee fair compensation for every contribution.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/events" className="btn-primary flex items-center space-x-2 text-sm sm:text-base py-3 px-6 shadow-lg shadow-purple-500/20">
                <span>View Available Events</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/volunteer-register" className="btn-secondary flex items-center space-x-2 text-sm sm:text-base py-3 px-6">
                <span>Join As Volunteer</span>
              </Link>
            </div>
          </div>

          {/* Stats Banner */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            {milestones.map((milestone, idx) => (
              <div key={idx} className="glass-panel p-6 rounded-2xl text-center hover:shadow-premium transition-all duration-300">
                <div className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                  {milestone.number}
                </div>
                <div className="text-sm font-bold text-gray-900 mb-1">{milestone.label}</div>
                <div className="text-xs text-gray-500">{milestone.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Do / Our Work Showcase */}
      <section className="py-16 bg-white/40 backdrop-blur-sm border-y border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 animate-slide-up">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              What We Do: How Our Crew Works
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              Behind every smooth conference, buzzing concert, or high-stakes gala, our teams are deployed with clear objectives and real-time coordination.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {workCategories.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div 
                  key={item.id}
                  className="glass-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:shadow-premium transition-all duration-300 group animate-slide-up"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div>
                    <div className="relative h-48 rounded-2xl overflow-hidden mb-6">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-950/70 via-transparent to-transparent"></div>
                      <span className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md text-gray-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                        {item.tag}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${item.color}`}>
                        <Icon size={22} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                        {item.title}
                      </h3>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed mb-6">
                      {item.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    {item.highlights.map((point, pIdx) => (
                      <div key={pIdx} className="flex items-center text-xs sm:text-sm text-gray-700">
                        <CheckCircle2 size={16} className="text-purple-600 mr-2 flex-shrink-0" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Case Studies / Past Work Highlights */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 animate-slide-up">
            <div>
              <div className="inline-flex items-center space-x-2 text-purple-600 text-sm font-semibold tracking-wider uppercase mb-2">
                <Award size={18} />
                <span>Track Record</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                Recent Events Powered by CrewLink
              </h2>
            </div>
            <p className="text-sm text-gray-500 max-w-md mt-4 md:mt-0">
              A sample of premier events where our organizers dispatched volunteer crews with live task verification and prompt payouts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pastWorkHighlights.map((event, idx) => (
              <div 
                key={idx}
                className="glass-panel rounded-3xl overflow-hidden hover:shadow-premium transition-all duration-300 group flex flex-col animate-slide-up"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <div className="relative h-52 overflow-hidden">
                  <img 
                    src={event.image} 
                    alt={event.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur-md text-xs font-bold text-gray-900 px-3 py-1 rounded-full shadow-sm">
                      {event.category}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-lg font-bold text-white leading-snug">
                      {event.title}
                    </h3>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex items-center">
                      <Users size={14} className="text-purple-600 mr-2" />
                      <span className="font-semibold text-gray-800">{event.volunteers}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin size={14} className="text-purple-600 mr-2" />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-600 bg-gray-50/80 p-3.5 rounded-xl border border-gray-100 italic">
                    "{event.achievement}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works for Both Sides */}
      <section className="py-20 bg-gradient-to-b from-purple-50/40 via-white to-purple-50/20 border-t border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 animate-slide-up">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How The CrewLink Ecosystem Works
            </h2>
            <p className="text-gray-600">
              Whether you are staging a multi-hall convention or looking to gain hands-on experience, our system keeps everyone aligned.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* For Organizers */}
            <div className="glass-panel p-8 rounded-3xl space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">For Event Organizers & Admins</h3>
                  <p className="text-xs text-gray-500">Fast staffing, live operations, peace of mind</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="p-1 bg-purple-100 rounded-full text-purple-600 mt-1"><CheckCircle2 size={16} /></div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Create & Publish Event Roles</h4>
                    <p className="text-xs text-gray-600">List specific roles, shifts, required skills, and transparent salary allocations (minimum ₹200+).</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-1 bg-purple-100 rounded-full text-purple-600 mt-1"><CheckCircle2 size={16} /></div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Real-Time Dispatch & Voice Notes</h4>
                    <p className="text-xs text-gray-600">Send direct voice instructions or updates to volunteers on the floor when timing or cues change.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-1 bg-purple-100 rounded-full text-purple-600 mt-1"><CheckCircle2 size={16} /></div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Review Live Proof & Sign-Off</h4>
                    <p className="text-xs text-gray-600">Inspect time-stamped photo proofs of setup, ushering, or booth coverage before approving payouts.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Volunteers */}
            <div className="glass-panel p-8 rounded-3xl space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">For Volunteers & Crew</h3>
                  <p className="text-xs text-gray-500">Valuable exposure, reliable pay, simple workflows</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="p-1 bg-indigo-100 rounded-full text-indigo-600 mt-1"><CheckCircle2 size={16} /></div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Browse & Apply in Seconds</h4>
                    <p className="text-xs text-gray-600">Explore 19+ categories from concerts to tech expos. See duties, venue location, and stipend upfront.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-1 bg-indigo-100 rounded-full text-indigo-600 mt-1"><CheckCircle2 size={16} /></div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Check In & Upload Completion Photo</h4>
                    <p className="text-xs text-gray-600">Report arrival at venue, record audio queries directly to the organizer, and snap a quick photo proof.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-1 bg-indigo-100 rounded-full text-indigo-600 mt-1"><CheckCircle2 size={16} /></div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Guaranteed Compensation & Experience Certificate</h4>
                    <p className="text-xs text-gray-600">Receive fair stipends directly and add verified event management credentials to your career portfolio.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 animate-slide-up">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Our Core Principles
            </h2>
            <p className="text-gray-600">
              The values that drive how we build software, partner with organizers, and treat every volunteer on our crew.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreValues.map((value, idx) => {
              const Icon = value.icon;
              return (
                <div 
                  key={idx} 
                  className="glass-panel p-6 rounded-2xl hover:shadow-premium hover:-translate-y-1 transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="relative rounded-3xl p-8 sm:p-14 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-900 text-white shadow-2xl overflow-hidden text-center animate-slide-up">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,70,239,0.3),transparent_50%)]"></div>
            
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Ready to Experience CrewLink?
              </h2>
              <p className="text-sm sm:text-base text-purple-100 leading-relaxed font-light">
                Whether you need reliable hands to bring your event vision to life, or you want to earn stipend while discovering the vibrant world of live events, your next step starts here.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Link 
                  to="/volunteer-register" 
                  className="px-6 py-3.5 bg-white text-purple-800 font-bold text-sm rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Sign Up As Volunteer
                </Link>
                <Link 
                  to="/events" 
                  className="px-6 py-3.5 bg-purple-600/60 hover:bg-purple-600 text-white font-bold text-sm rounded-xl border border-white/20 transition-all hover:-translate-y-0.5"
                >
                  Explore Events
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default About;
