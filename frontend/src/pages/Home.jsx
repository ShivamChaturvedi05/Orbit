import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import api from '../api';
import { Search as SearchIcon, ShoppingCart, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

const Home = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef();

  const { isAuthenticated } = useContext(AuthContext);
  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate();

  // Infinite Scroll Observer Setup
  const lastProductElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      // If the sentinel (last item) is visible on screen, and we have more pages to load...
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Load products based on page (Infinite Scroll)
  useEffect(() => {
    const fetchProducts = async () => {
      // Don't run pagination fetches if the user is currently looking at search results
      if (query.trim() && !hasMore) return;

      setLoading(true);
      try {
        const res = await api.get(`/api/inventory/public?page=${page}&limit=20`);

        setResults(prev => {
          // Use a Set to prevent duplicates (React StrictMode double-invokes useEffect)
          const existingIds = new Set(prev.map(p => p._id));
          const newProducts = res.data.filter(p => !existingIds.has(p._id));
          return [...prev, ...newProducts];
        });

        // If the backend returns less than 20 items, we've hit the end of the database!
        if (res.data.length < 20) {
          setHasMore(false);
        }
      } catch (err) {
        console.error("Failed to load products");
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page]); // This effect ONLY runs when 'page' state changes!

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      // If they clear the search and hit Enter, reset to the normal infinite scroll feed
      setResults([]);
      setPage(1);
      setHasMore(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Connect to the API Gateway's public inventory route!
      const res = await api.get(`/api/inventory/public/search?query=${encodeURIComponent(query)}`);
      setResults(res.data); // The AI Search API returns the top array directly
      setHasMore(false); // Disable infinite scrolling while viewing search results
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
            onChange={(e) => {
              setQuery(e.target.value);
              // Auto-reset to feed if they clear the input manually
              if (e.target.value === '') {
                setResults([]);
                setPage(1);
                setHasMore(true);
              }
            }}
          />
          <button
            type="submit"
            className="absolute inset-y-2 right-2 bg-apple-dark text-white rounded-xl px-8 font-medium hover:bg-black transition-colors hover:scale-105 active:scale-95"
          >
            Search
          </button>
        </form>
      </div>

      {error && <div className="text-center text-red-500 mb-8 font-medium">{error}</div>}

      {/* Results Grid */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-4 mx-4 md:mx-12 animate-fade-in-up">
          {results.map((item, index) => {
            const isLast = index === results.length - 1;
            return (
              <div
                key={item._id}
                ref={isLast ? lastProductElementRef : null} // Attach observer to the very last card
                className="glass-card flex flex-col overflow-hidden hover:scale-[1.02] hover:shadow-xl transition-all cursor-default"
              >

                {/* Product Image - WITH LAZY LOADING */}
                <div className="h-64 bg-white flex items-center justify-center p-6 border-b border-gray-100">
                  <img
                    src={item.imgUrl}
                    alt={item.name}
                    loading="lazy"
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
                    <div className="flex flex-col">
                      <div className="text-3xl font-bold tracking-tight">${item.price}</div>
                      <div className="text-xs text-gray-400 mt-1">{item.stockQuantity} in stock</div>
                    </div>
                    <button
                      onClick={() => addToCart(item)}
                      className="flex items-center text-white font-semibold bg-apple-blue hover:bg-blue-600 transition-colors px-5 py-2.5 rounded-full shadow-md active:scale-95"
                    >
                      Add to Cart <ShoppingCart className="ml-2 h-4 w-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Loading Spinner at the bottom when fetching more pages */}
      {loading && (
        <div className="flex justify-center items-center mt-12 mb-8">
          <Loader2 className="h-8 w-8 text-apple-blue animate-spin" />
        </div>
      )}

      {!hasMore && results.length > 0 && !query.trim() && (
        <div className="text-center text-gray-400 mt-12 mb-8 font-medium">
          You've reached the end of the catalog!
        </div>
      )}
    </div>
  );
};

export default Home;
