import { Link } from 'react-router-dom';
import { Search, ShoppingBag, User } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

const Navbar = () => {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const { cartCount, setIsCartOpen } = useContext(CartContext);
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card mx-4 mt-4 px-6 py-4 flex items-center justify-between">
      {/* Logo */}
      <Link to="/" className="text-xl font-bold tracking-tight text-apple-dark">
        Orbit.
      </Link>

      {/* Center Links (Optional, keeping it clean for now) */}
      <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-500">
        <Link to="/" className="hover:text-apple-dark transition-colors">Store</Link>
        <Link to="/" className="hover:text-apple-dark transition-colors">Mac</Link>
        <Link to="/" className="hover:text-apple-dark transition-colors">Accessories</Link>
      </div>

      {/* Right Icons */}
      <div className="flex items-center space-x-6 text-apple-dark">
        <button className="hover:scale-110 transition-transform">
          <Search size={20} strokeWidth={2.5} />
        </button>
        
        <Link to={isAuthenticated ? "/dashboard" : "/login"} className="hover:scale-110 transition-transform">
          <User size={20} strokeWidth={2.5} />
        </Link>

        <button 
          className="hover:scale-110 transition-transform relative"
          onClick={() => setIsCartOpen(true)}
        >
          <ShoppingBag size={20} strokeWidth={2.5} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-apple-blue text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
