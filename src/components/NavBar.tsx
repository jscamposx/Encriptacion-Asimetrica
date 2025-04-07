import { useState, useEffect } from 'react';

const Navbar = () => {
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentPath(window.location.pathname);
    }
  }, []);

  // --- Link styling classes ---
  const linkBaseClasses = "p-2 rounded-full transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:ring-white";
  const activeLinkClasses = "bg-indigo-600 text-white shadow-md";
  const inactiveLinkClasses = "text-gray-300 hover:bg-gray-700 hover:text-white";

  const getLinkClasses = (href: string) => {
    const isActive = currentPath === href || currentPath === `${href}/`;
    return `${linkBaseClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`;
  };

  return (
    <nav className="bg-gradient-to-r from-slate-900 via-gray-900 to-black text-white shadow-xl sticky top-0 z-50 border-b border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex-shrink-0">
            <a href="/" className="flex items-center group text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white rounded-md p-1 -ml-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400 group-hover:text-indigo-300 transition-transform duration-300 group-hover:rotate-[-12deg]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 1 1 0 000-2zM2 16a1 1 0 011-1h1v1H2v-1z" clipRule="evenodd" />
              </svg>
            </a>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4 lg:space-x-6">
              <a href="/" className={getLinkClasses('/')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 opacity-80" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </a>
              <a href="/Encryptor" className={getLinkClasses('/Encryptor')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 opacity-80" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="/Decryptor" className={getLinkClasses('/Decryptor')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 opacity-80" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0l-4.243-4.243a2 2 0 112.828-2.828L10 5.172l2.586-2.586z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M8.414 11.586a2 2 0 102.828 2.828l3-3a2 2 0 00-2.828-2.828L10 12.828l-1.586-1.586z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>

          {/* Mobile Links - Iconos directos */}
          <div className="md:hidden flex items-center space-x-4">
            <a href="/Encryptor" className={getLinkClasses('/Encryptor')}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 opacity-90" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </a>
            
            <a href="/Decryptor" className={getLinkClasses('/Decryptor')}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 opacity-90" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;