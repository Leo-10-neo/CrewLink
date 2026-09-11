import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { HeartHandshake, ArrowRight, CheckCircle2 } from 'lucide-react';
import { API_URL } from '../services/api';

const VolunteerRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    gender: '',
    age: '',
    phone: '',
    city: '',
    address: '',
    photo: '',
    aadharNo: '',
    panCardNo: '',
    skills: '',
    expertRole: '',
    experience: '',
    languages: '',
    availability: '',
    preferredEventTypes: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
    bloodGroup: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Photo size should be less than 2MB');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result }));
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => {
    if (step === 1 && (!formData.username || !formData.email || !formData.password)) {
      setError('Please fill in required account details');
      return;
    }
    if (step === 1 && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    // Transform comma-separated strings to arrays
    const splitTrim = (str) => str ? str.split(',').map(s => s.trim()).filter(Boolean) : [];

    const payload = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      role: 'volunteer',
      fullName: formData.fullName,
      gender: formData.gender,
      age: formData.age ? parseInt(formData.age, 10) : undefined,
      phone: formData.phone,
      city: formData.city,
      address: formData.address,
      photo: formData.photo,
      aadharNo: formData.aadharNo,
      panCardNo: formData.panCardNo,
      skills: splitTrim(formData.skills),
      languages: splitTrim(formData.languages),
      availability: splitTrim(formData.availability),
      preferredEventTypes: splitTrim(formData.preferredEventTypes),
      expertRole: formData.expertRole,
      experience: formData.experience,
      emergencyContact: {
        name: formData.emergencyName,
        phone: formData.emergencyPhone,
        relation: formData.emergencyRelation
      },
      bloodGroup: formData.bloodGroup
    };

    try {
      const response = await axios.post(`${API_URL}/auth/register`, payload);
      if (response.data.token) {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col justify-center items-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-gray-100">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Complete!</h2>
          <p className="text-gray-600 mb-8">
            Thank you for registering as a volunteer! Your profile has been automatically verified. 
            You can log in now to access your volunteer dashboard and apply for events.
          </p>
          <Link to="/login" className="btn-primary w-full py-3 inline-flex justify-center items-center gap-2">
            Proceed to Login <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center space-x-2 text-accent hover:opacity-80 transition-opacity mb-4">
            <HeartHandshake size={32} />
            <span className="text-2xl font-bold">CrewLink Volunteer</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Join our volunteer crew</h2>
          <p className="mt-2 text-gray-600">Help make incredible events happen</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Progress Bar */}
          <div className="w-full bg-gray-100 h-1.5">
            <div 
              className="bg-accent h-1.5 transition-all duration-500 ease-out" 
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
          <div className="bg-gray-50 border-b border-gray-100 px-8 py-4 flex justify-between items-center text-sm font-medium">
            <span className={`transition-colors duration-300 ${step >= 1 ? 'text-accent' : 'text-gray-400'}`}>1. Account</span>
            <span className={`transition-colors duration-300 ${step >= 2 ? 'text-accent' : 'text-gray-400'}`}>2. Personal</span>
            <span className={`transition-colors duration-300 ${step >= 3 ? 'text-accent' : 'text-gray-400'}`}>3. Experience</span>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg">
                {error}
              </div>
            )}

            <div>
              
              {/* STEP 1: ACCOUNT & BASIC IDENTITY */}
              {step === 1 && (
                <div className="space-y-6 animate-slide-up">
                  <h3 className="text-lg font-semibold border-b pb-2">Account Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                      <input type="text" name="username" value={formData.username} onChange={handleChange} required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                      <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                      <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: PERSONAL INFO */}
              {step === 2 && (
                <div className="space-y-6 animate-slide-up">
                  <h3 className="text-lg font-semibold border-b pb-2">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                      <input type="number" name="age" value={formData.age} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo (Max 2MB)</label>
                      <div className="flex items-center gap-3">
                        <input type="file" accept="image/*" onChange={handleFileChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                        {formData.photo && formData.photo.startsWith('data:image') && (
                          <div className="flex-shrink-0">
                            <img src={formData.photo} alt="Preview" className="w-10 h-10 object-cover rounded-full border border-gray-200" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar No.</label>
                      <input type="text" name="aadharNo" value={formData.aadharNo} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PAN Card No.</label>
                      <input type="text" name="panCardNo" value={formData.panCardNo} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: EXPERIENCE & SKILLS */}
              {step === 3 && (
                <div className="space-y-6 animate-slide-up">
                  <h3 className="text-lg font-semibold border-b pb-2">Experience & Availability</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role you are expert at</label>
                      <select name="expertRole" value={formData.expertRole} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="">Select your expert role</option>
                        <option value="Event Coordinator team">Event Coordinator team</option>
                        <option value="Event Coordinator Assistant">Event Coordinator Assistant</option>
                        <option value="Registration Volunteer">Registration Volunteer</option>
                        <option value="Guest Management">Guest Management</option>
                        <option value="Crowd Management">Crowd Management</option>
                        <option value="Decoration Team">Decoration Team</option>
                        <option value="Stage Management">Stage Management</option>
                        <option value="Technical Support">Technical Support</option>
                        <option value="Photography/Video Team">Photography/Video Team</option>
                        <option value="Photography Volunteer">Photography Volunteer</option>
                        <option value="Videography Volunteer">Videography Volunteer</option>
                        <option value="Food & Catering Support">Food & Catering Support</option>
                        <option value="Hospitality Volunteer">Hospitality Volunteer</option>
                        <option value="Logistics Volunteer">Logistics Volunteer</option>
                        <option value="Transportation Volunteer">Transportation Volunteer</option>
                        <option value="Security/Safety Support">Security/Safety Support</option>
                        <option value="Communication Volunteer">Communication Volunteer</option>
                        <option value="Social Media Volunteer">Social Media Volunteer</option>
                        <option value="First-Aid Support">First-Aid Support</option>
                        <option value="Activity/Game Volunteer">Activity/Game Volunteer</option>
                        <option value="Help Desk Volunteer">Help Desk Volunteer</option>
                        <option value="Backstage Volunteer">Backstage Volunteer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Other Skills (comma separated)</label>
                      <input type="text" name="skills" value={formData.skills} onChange={handleChange} placeholder="e.g. Crowd control, First aid, Lighting" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Languages (comma separated)</label>
                      <input type="text" name="languages" value={formData.languages} onChange={handleChange} placeholder="e.g. English, Hindi, Spanish" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Availability (comma separated)</label>
                      <input type="text" name="availability" value={formData.availability} onChange={handleChange} placeholder="e.g. Weekends, Evenings" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Event Types (comma separated)</label>
                      <input type="text" name="preferredEventTypes" value={formData.preferredEventTypes} onChange={handleChange} placeholder="e.g. Concerts, Corporate" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Experience Summary</label>
                      <textarea name="experience" value={formData.experience} onChange={handleChange} rows="3" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold border-b pb-2 pt-4">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                      <input type="text" name="emergencyName" value={formData.emergencyName} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input type="tel" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
                      <input type="text" name="emergencyRelation" value={formData.emergencyRelation} onChange={handleChange} placeholder="e.g. Parent, Sibling" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold border-b pb-2 pt-4">Medical Background</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Blood group</label>
                      <input type="text" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} placeholder="e.g. B+" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-10 flex justify-between pt-6 border-t border-gray-100">
                {step > 1 ? (
                  <button type="button" onClick={prevStep} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                    Back
                  </button>
                ) : (
                  <div></div>
                )}
                
                {step < 3 ? (
                  <button type="button" onClick={nextStep} className="btn-primary px-8 py-2">
                    Next Step
                  </button>
                ) : (
                  <button type="button" disabled={isLoading} onClick={handleSubmit} className="btn-primary px-8 py-2 flex items-center space-x-2 disabled:opacity-50">
                    {isLoading ? <span>Submitting...</span> : <span>Complete Registration</span>}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-center mt-6 text-gray-500 text-sm">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Sign in here</Link>
        </p>
      </div>
    </div>
  );
};

export default VolunteerRegister;
