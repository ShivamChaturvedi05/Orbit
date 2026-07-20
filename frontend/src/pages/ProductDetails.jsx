import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ShoppingCart, Star, Loader2, ArrowLeft } from 'lucide-react';
import { CartContext } from '../context/CartContext';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        // Fetch Product
        const productRes = await api.get(`/api/inventory/public/${id}`);
        setProduct(productRes.data);

        // Fetch Reviews
        const reviewsRes = await api.get(`/api/inventory/public/${id}/reviews`);
        setReviews(reviewsRes.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-apple-blue animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <h2 className="text-3xl font-bold text-apple-dark mb-4">{error || 'Product not found'}</h2>
        <button onClick={() => navigate('/')} className="text-apple-blue hover:underline">Return Home</button>
      </div>
    );
  }

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        className={`h-5 w-5 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} 
      />
    ));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in-up">
      <button 
        onClick={() => navigate('/')} 
        className="flex items-center text-gray-500 hover:text-apple-blue transition-colors mb-8"
      >
        <ArrowLeft className="h-5 w-5 mr-2" /> Back to Products
      </button>

      {/* Top Section: Product Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        {/* Image */}
        <div className="glass-card flex items-center justify-center p-8 h-[500px]">
          <img 
            src={product.imgUrl} 
            alt={product.name} 
            className="max-h-full max-w-full object-contain mix-blend-multiply" 
          />
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <span className="text-sm font-bold uppercase tracking-wider text-apple-blue mb-2 block">
            {product.category || 'Tech'}
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-apple-dark mb-4">{product.name}</h1>
          
          <div className="flex items-center space-x-2 mb-6">
            <div className="flex">{renderStars(Math.round(product.averageRating || 0))}</div>
            <span className="text-gray-500 font-medium">({product.reviewCount || 0} reviews)</span>
          </div>

          <div className="text-5xl font-bold tracking-tight text-apple-dark mb-6">
            ${product.price}
          </div>

          <p className="text-gray-600 text-lg leading-relaxed mb-8 flex-grow">
            {product.description}
          </p>

          <div className="flex items-center space-x-6 border-t border-gray-100 pt-8">
            <div className="text-sm text-gray-500 font-medium">
              <span className={product.stockQuantity > 0 ? "text-green-600 font-bold" : "text-red-500"}>
                {product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
            
            <button
              onClick={() => addToCart(product)}
              disabled={product.stockQuantity <= 0}
              className="flex-1 flex items-center justify-center text-white font-bold bg-apple-blue hover:bg-blue-600 transition-colors py-4 rounded-xl shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add to Cart <ShoppingCart className="ml-3 h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Verified Reviews */}
      <div className="border-t border-gray-200 pt-16">
        <h2 className="text-3xl font-bold tracking-tight text-apple-dark mb-10">Customer Reviews</h2>
        
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-lg">No reviews yet. Be the first to buy and review this product!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reviews.map((review) => (
              <div key={review._id} className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900">{review.reviewerName}</h4>
                    <div className="flex mt-1">{renderStars(review.rating)}</div>
                  </div>
                  <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full flex items-center">
                    <span className="mr-1">✓</span> Verified Purchase
                  </span>
                </div>
                <p className="text-gray-600 leading-relaxed">"{review.comment}"</p>
                <div className="text-xs text-gray-400 mt-4">
                  {new Date(review.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
