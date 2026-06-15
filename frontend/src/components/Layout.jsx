import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col pt-24">
      {/* The Navbar sits fixed at the top */}
      <Navbar />
      
      {/* The Outlet renders whatever page we are currently on (Home, Login, Search, etc) */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
