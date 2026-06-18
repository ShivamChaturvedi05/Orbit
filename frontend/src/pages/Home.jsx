import { useState } from 'react';
import axios from 'axios';
import { Search as SearchIcon, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Connect to the API Gateway's public inventory route!
      const res = await axios.get(`http://localhost:3000/api/inventory/public/search?query=${encodeURIComponent(query)}`);
      setResults(res.data); // The API returns the array directly!
    } catch (err) {
      setError('Failed to fetch AI results. Is the Inventory Service running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center pt-24 pb-16 text-center animate-fade-in">
        <h1 className="text-6xl font-bold tracking-tighter mb-6 text-apple-dark">
          Find exactly what you mean.
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mb-12 font-light">
          Powered by Gemini AI Embeddings. Try searching for abstract concepts like "gadgets to listen to music" instead of exact keywords.
        </p>
        
        {/* Massive Search Bar */}
        <form onSubmit={handleSearch} className="w-full max-w-3xl relative group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <SearchIcon className="h-6 w-6 text-gray-400 group-focus-within:text-apple-blue transition-colors" />
          </div>
          <input
            type="text"
            className="w-full pl-16 pr-32 py-5 text-lg rounded-2xl border border-gray-200 shadow-soft focus:outline-none focus:ring-4 focus:ring-apple-blue/20 focus:border-apple-blue transition-all bg-white/80 backdrop-blur-md"
            placeholder="Search by concept, feeling, or feature..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            type="submit"
            className="absolute inset-y-2 right-2 bg-apple-dark text-white rounded-xl px-8 font-medium hover:bg-black transition-colors hover:scale-105 active:scale-95"
          >
            {loading ? 'Thinking...' : 'Search'}
          </button>
        </form>
      </div>

      {error && <div className="text-center text-red-500 mb-8 font-medium">{error}</div>}

      {/* Results Grid */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-4 animate-fade-in-up">
          {results.map((item) => (
            <div key={item._id} className="glass-card flex flex-col overflow-hidden hover:scale-[1.02] hover:shadow-xl transition-all cursor-default">
              
              {/* Product Image */}
              <div className="h-64 bg-white flex items-center justify-center p-6 border-b border-gray-100">
                <img 
                  src={item.imgUrl} 
                  alt={item.name} 
                  className="max-h-full max-w-full object-contain mix-blend-multiply"
                />
              </div>

              {/* Product Details */}
              <div className="p-8 flex flex-col flex-grow">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-apple-blue mb-3 block">
                    {item.category || 'Tech'}
                  </span>
                  <h3 className="text-xl font-bold mb-3 tracking-tight line-clamp-2">{item.name}</h3>
                  <p className="text-gray-500 text-sm mb-6 leading-relaxed line-clamp-3">
                    {item.description}
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-100/50">
                  <div className="text-3xl font-bold tracking-tight">${item.price}</div>
                  <Link 
                    to={`/checkout/${item._id}`}
                    className="flex items-center text-apple-blue font-semibold hover:text-blue-700 transition-colors group bg-apple-blue/10 px-4 py-2 rounded-full"
                  >
                    Buy Now <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
