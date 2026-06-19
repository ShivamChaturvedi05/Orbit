import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Package, Calendar, DollarSign, LogOut } from 'lucide-react';
import api from '../api';

const Dashboard = () => {
  const { logout } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/api/orders');
        setOrders(res.data);
      } catch (err) {
        setError('Failed to fetch order history. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="pt-24 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen bg-gray-50 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Your Dashboard</h1>
            <p className="text-gray-500 mt-2">View and manage your order history.</p>
          </div>
          <button 
            onClick={logout}
            className="flex items-center space-x-2 bg-white text-red-600 px-4 py-2 rounded-lg border border-red-100 hover:bg-red-50 transition shadow-sm"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Log Out</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {orders.length === 0 && !error ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900">No orders yet</h3>
            <p className="text-gray-500 mt-2">When you place an order, it will appear here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              // Calculate total from items since our order model doesn't store the grand total at the top level
              const orderTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

              return (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="border-b border-gray-100 bg-gray-50/50 p-6 flex flex-wrap justify-between items-center gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Order Placed</p>
                      <div className="flex items-center text-gray-900 font-medium">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Amount</p>
                      <div className="flex items-center text-gray-900 font-medium">
                        <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                        {orderTotal.toFixed(2)}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Order ID</p>
                      <p className="text-gray-900 font-medium text-sm font-mono">{order.id}</p>
                    </div>

                    <div className="space-y-1 text-right">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${
                        order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <ul className="divide-y divide-gray-100">
                      {order.items.map((item, index) => (
                        <li key={`${item.productId}-${index}`} className="py-4 flex flex-col sm:flex-row sm:items-center">
                          {/* If snapshot has imgUrl, show it, otherwise fallback */}
                          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                            {item.imgUrl ? (
                              <img src={item.imgUrl} alt={item.name} className="h-full w-full object-cover object-center" />
                            ) : (
                              <Package className="h-8 w-8 text-gray-300" />
                            )}
                          </div>
                          
                          <div className="ml-0 sm:ml-6 mt-4 sm:mt-0 flex-1 flex flex-col">
                            <div>
                              <div className="flex justify-between">
                                <h4 className="text-base font-medium text-gray-900">
                                  {item.name || `Product ID: ${item.productId}`}
                                </h4>
                                <p className="ml-4 text-base font-medium text-gray-900">${parseFloat(item.price).toFixed(2)}</p>
                              </div>
                              <p className="mt-1 text-sm text-gray-500">Qty: {item.quantity}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
