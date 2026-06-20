import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { PackagePlus, Loader2 } from 'lucide-react';

const Sell = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    imgUrl: '',
    stockQuantity: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Post to the SECURE inventory route so the backend gets the user's ID
      await api.post('/api/inventory/secure', {
        ...formData,
        price: parseFloat(formData.price)
      });
      
      // Redirect to home after successfully listing the product
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to list product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 min-h-screen bg-gray-50 flex items-center justify-center pb-12">
      <div className="bg-white max-w-lg w-full mx-4 rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="bg-apple-dark p-8 text-center">
          <PackagePlus className="h-12 w-12 text-white mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white tracking-tight">Sell an Item</h2>
          <p className="text-gray-300 mt-2 font-medium">List your product on the Orbit Marketplace.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Product Title</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-apple-blue focus:border-apple-blue transition-colors bg-gray-50 focus:bg-white"
                placeholder="e.g. Vintage Keyboard"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                required
                rows="3"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-apple-blue focus:border-apple-blue transition-colors bg-gray-50 focus:bg-white resize-none"
                placeholder="Describe the condition, features, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Price ($)</label>
                <input
                  type="number"
                  name="price"
                  step="0.01"
                  min="0.50"
                  required
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-apple-blue focus:border-apple-blue transition-colors bg-gray-50 focus:bg-white"
                  placeholder="99.99"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  name="stockQuantity"
                  min="1"
                  required
                  value={formData.stockQuantity || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-apple-blue focus:border-apple-blue transition-colors bg-gray-50 focus:bg-white"
                  placeholder="100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-apple-blue focus:border-apple-blue transition-colors bg-gray-50 focus:bg-white"
                >
                  <option value="" disabled>Select...</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Computers">Computers</option>
                  <option value="Audio">Audio</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Image URL</label>
                <input
                  type="url"
                  name="imgUrl"
                  required
                  value={formData.imgUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-apple-blue focus:border-apple-blue transition-colors bg-gray-50 focus:bg-white"
                  placeholder="https://example.com/image.png"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-apple-blue text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-600 transition-colors shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Generating AI Embedding...
                </>
              ) : (
                'List Product for Sale'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Sell;
