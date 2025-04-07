import { useState } from 'react';
// Importa NavLink y useLocation si estás usando react-router-dom v6+
// import { NavLink, useLocation } from 'react-router-dom';

// Si NO usas react-router-dom, puedes quitar useLocation y cambiar NavLink por <a>

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  // Descomenta la siguiente línea si usas react-router-dom
  // const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);

  // --- Clases de estilo reutilizables ---

  // Clases base para enlaces (comunes en desktop y mobile)
  const linkBaseClasses = "rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ease-in-out";

  // Clases para enlaces activos e inactivos (DESKTOP)
  // Modifica 'bg-indigo-700' y 'text-white' para el estilo activo que prefieras
  const activeDesktopLinkClasses = "bg-indigo-700 text-white shadow-inner";
  const inactiveDesktopLinkClasses = "text-gray-300 hover:bg-gray-700 hover:text-white";

  // Clases para enlaces activos e inactivos (MOBILE)
  // Modifica 'bg-indigo-600' y 'text-white' para el estilo activo que prefieras
  const activeMobileLinkClasses = "bg-indigo-600 text-white block"; // 'block' es importante aquí
  const inactiveMobileLinkClasses = "text-gray-300 hover:bg-gray-700 hover:text-white block"; // 'block' es importante aquí

  // --- Función auxiliar para determinar las clases del enlace ---
  // (Versión SIN react-router-dom - Comenta/Descomenta según necesites)
  // const getLinkClasses = (href: string, isMobile = false) => {
  //   const isActive = typeof window !== 'undefined' && window.location.pathname === href;
  //   if (isMobile) {
  //     return `${linkBaseClasses} ${isActive ? activeMobileLinkClasses : inactiveMobileLinkClasses}`;
  //   }
  //   return `${linkBaseClasses} ${isActive ? activeDesktopLinkClasses : inactiveDesktopLinkClasses}`;
  // };

  // (Versión CON react-router-dom - Comenta/Descomenta según necesites)
   const getLinkClasses = (path: string, isMobile = false) => {
     // Descomenta la línea de useLocation al inicio si usas esto
     // const isActive = location.pathname === path || location.pathname === `${path}/`; // Considera trailing slash
     // --- Simulación sin react-router (borra si usas react-router) ---
     const isActive = typeof window !== 'undefined' && (window.location.pathname === path || window.location.pathname === `${path}/`);
     // --- Fin simulación ---

     if (isMobile) {
       return `${linkBaseClasses} ${isActive ? activeMobileLinkClasses : inactiveMobileLinkClasses}`;
     }
     return `${linkBaseClasses} ${isActive ? activeDesktopLinkClasses : inactiveDesktopLinkClasses}`;
   };


  // --- Componente ---
  return (
    // Navbar principal: fondo gradiente, sombra, pegajosa arriba, z-index alto
    <nav className="bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white shadow-lg sticky top-0 z-50">
      {/* Contenedor principal con ancho máximo y padding */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Contenedor flex para alinear elementos, altura fija */}
        <div className="flex items-center justify-between h-16">

          {/* Sección Izquierda: Logo/Título */}
          <div className="flex-shrink-0">
            {/* Cambia NavLink por <a> si no usas react-router-dom */}
            <a href="/" className="flex items-center group text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white rounded-md">
              {/* Icono SVG de candado/seguridad */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-400 group-hover:text-indigo-300 transition-colors duration-200" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 1 1 0 000-2zM2 16a1 1 0 011-1h1v1H2v-1z" clipRule="evenodd" />
              </svg>
              <span className="ml-2 text-xl font-semibold tracking-tight group-hover:text-gray-100 transition-colors duration-200">
                Cripto Web
              </span>
            </a>
          </div>

          {/* Sección Derecha (Desktop): Enlaces */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {/* Cambia NavLink por <a> si no usas react-router-dom */}
              <a href="/" className={getLinkClasses('/')}>
                 🏠 Inicio
              </a>
              <a href="/Encryptor" className={getLinkClasses('/Encriptacion')}>
                 🔐 Encriptar
              </a>
              <a href="/Decryptor" className={getLinkClasses('/Desincriptar')}>
                 🔓 Desencriptar
              </a>
            </div>
          </div>

          {/* Sección Derecha (Mobile): Botón Hamburguesa */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={toggleMenu}
              type="button"
              className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded={isOpen} // Indica si el menú está expandido
              aria-label={isOpen ? "Cerrar menú principal" : "Abrir menú principal"}
            >
              <span className="sr-only">{isOpen ? "Cerrar menú" : "Abrir menú"}</span>
              {/* Icono cambia entre hamburguesa y 'X' */}
              {isOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Menú Móvil Desplegable */}
      {/* Se muestra/oculta basado en el estado `isOpen` */}
      {/* La clase `md:hidden` asegura que solo sea visible en móvil */}
      <div
        className={`md:hidden absolute w-full bg-gray-800 bg-opacity-95 backdrop-blur-sm shadow-lg border-t border-gray-700 ${isOpen ? 'block' : 'hidden'}`}
        id="mobile-menu"
        // No necesita 'top-16' si es 'absolute' y el padre <nav> es 'sticky' o 'relative'
        // Tailwind maneja bien el 'absolute' dentro de un padre posicionado
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {/* Cambia NavLink por <a> si no usas react-router-dom */}
          {/* Se añade onClick para cerrar el menú al navegar */}
          <a href="/" className={getLinkClasses('/', true)} onClick={() => setIsOpen(false)}>
             🏠 Inicio
          </a>
          <a href="/Encriptacion" className={getLinkClasses('/Encriptacion', true)} onClick={() => setIsOpen(false)}>
             🔐 Encriptar
          </a>
          <a href="/Desincriptar" className={getLinkClasses('/Desincriptar', true)} onClick={() => setIsOpen(false)}>
             🔓 Desencriptar
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;