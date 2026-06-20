import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Package, TrendingUp, DollarSign, Edit2, Check, X } from 'lucide-react';

const SellerDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for inline editing
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ price: '', stockQuantity: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/inventory/secure/seller');
      setProducts(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch your inventory.');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (product) => {
    setEditingId(product._id);
    setEditForm({ price: product.price, stockQuantity: product.stockQuantity });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ price: '', stockQuantity: '' });
  };

  const handleSave = async (id) => {
    setSaving(true);
    try {
      const response = await api.put(`/api/inventory/secure/seller/${id}`, {
        price: parseFloat(editForm.price),
        stockQuantity: parseInt(editForm.stockQuantity)
      });
      
      // Update local state
      setProducts(products.map(p => p._id === id ? response.data.product : p));
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert('Failed to update product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-32 pb-16 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-apple-blue"></div>
      </div>
    );
  }

  // Calculate Stats
  const totalSalesCount = products.reduce((sum, p) => sum + (p.salesCount || 0), 0);
  const totalRevenue = products.reduce((sum, p) => sum + ((p.salesCount || 0) * p.price), 0);

  return (
    <div className="pt-24 pb-16 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Header & Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Seller Hub</h1>
            <p className="text-gray-500 mt-1">Manage your inventory and track your sales.</p>
          </div>
          <Link 
            to="/sell" 
            className="bg-apple-blue text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-md text-center"
          >
            + Add New Product
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
            <div className="bg-blue-50 p-4 rounded-xl mr-4">
              <Package className="h-8 w-8 text-apple-blue" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Listings</p>
              <h3 className="text-2xl font-bold text-gray-900">{products.length}</h3>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
            <div className="bg-green-50 p-4 rounded-xl mr-4">
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Items Sold</p>
              <h3 className="text-2xl font-bold text-gray-900">{totalSalesCount}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
            <div className="bg-purple-50 p-4 rounded-xl mr-4">
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</h3>
            </div>
          </div>
        </div>

        {/* Inventory List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-900 text-lg">Your Inventory</h3>
          </div>
          
          {error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>You haven't listed any products yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-sm text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">Product</th>
                    <th className="px-6 py-4 font-semibold">Price</th>
                    <th className="px-6 py-4 font-semibold">Stock</th>
                    <th className="px-6 py-4 font-semibold">Sold</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((product) => {
                    const isEditing = editingId === product._id;
                    
                    return (
                      <tr key={product._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <img 
                              src={product.imgUrl || 'https://via.placeholder.com/40'} 
                              alt={product.name}
                              className="h-10 w-10 rounded-lg object-cover bg-gray-100 border border-gray-200 mr-3"
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/40?text=No+Image' }}
                            />
                            <div>
                              <p className="font-semibold text-gray-900 line-clamp-1">{product.name}</p>
                              <p className="text-xs text-gray-500">{product.category}</p>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <input 
                              type="number" 
                              step="0.01"
                              className="w-24 px-2 py-1 border rounded-md"
                              value={editForm.price}
                              onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                            />
                          ) : (
                            <span className="font-medium">${product.price.toFixed(2)}</span>
                          )}
                        </td>
                        
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <input 
                              type="number" 
                              className="w-20 px-2 py-1 border rounded-md"
                              value={editForm.stockQuantity}
                              onChange={(e) => setEditForm({...editForm, stockQuantity: e.target.value})}
                            />
                          ) : (
                            <span className={`font-medium ${product.stockQuantity < 10 ? 'text-orange-500' : 'text-gray-900'}`}>
                              {product.stockQuantity}
                            </span>
                          )}
                        </td>
                        
                        <td className="px-6 py-4 text-gray-500 font-medium">
                          {product.salesCount || 0}
                        </td>
                        
                        <td className="px-6 py-4 text-right">
                          {isEditing ? (
                            <div className="flex justify-end space-x-2">
                              <button 
                                onClick={() => handleSave(product._id)}
                                disabled={saving}
                                className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                title="Save"
                              >
                                <Check size={16} strokeWidth={3} />
                              </button>
                              <button 
                                onClick={cancelEditing}
                                disabled={saving}
                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                title="Cancel"
                              >
                                <X size={16} strokeWidth={3} />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => startEditing(product)}
                              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 hover:text-apple-dark transition-colors"
                              title="Edit Price & Stock"
                            >
                              <Edit2 size={16} strokeWidth={2.5} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
