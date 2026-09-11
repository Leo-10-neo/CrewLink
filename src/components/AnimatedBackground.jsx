import React from 'react';

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-crew-subtle">
      {/* Animated blob 1 */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-300 mix-blend-multiply filter blur-[100px] opacity-70 animate-blob"></div>
      
      {/* Animated blob 2 */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-300 mix-blend-multiply filter blur-[100px] opacity-70 animate-blob" style={{ animationDelay: '2s' }}></div>
      
      {/* Animated blob 3 */}
      <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-indigo-300 mix-blend-multiply filter blur-[120px] opacity-60 animate-blob" style={{ animationDelay: '4s' }}></div>
    </div>
  );
};

export default AnimatedBackground;
