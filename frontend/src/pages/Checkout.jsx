import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

// Use the public key from the environment variables!
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ cartItems, totalAmount, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    // 1. Create a Stripe Token directly from the card element
    const cardElement = elements.getElement(CardElement);
    const { error: stripeError, token: stripeToken } = await stripe.createToken(cardElement);

    if (stripeError) {
      setError(stripeError.message);
      setLoading(false);
      return;
    }

    try {
      // Step 4: The Microservices Saga!
      // Send an array of items to the Order Service!
      const itemsPayload = cartItems.map(item => ({
        productId: item.product._id,
        quantity: item.quantity
      }));

      const res = await api.post('/api/orders', {
        items: itemsPayload,
        stripeToken: stripeToken.id
      });

      if (res.status === 201) {
        onSuccess(res.data.order.id);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 focus-within:bg-white focus-within:ring-2 focus-within:ring-apple-blue transition-all">
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#1d1d1f',
              '::placeholder': { color: '#a1a1a6' },
            },
            invalid: { color: '#ef4444' },
          },
        }}/>
      </div>
      
      {error && <div className="text-sm font-medium text-red-500">{error}</div>}
      
      <button 
        type="submit" 
        disabled={!stripe || loading}
        className="w-full bg-apple-blue text-white font-bold py-4 rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
      >
        {loading ? 'Processing...' : `Pay $${totalAmount.toFixed(2)}`}
      </button>
    </form>
  );
};

const Checkout = () => {
  const { cartItems, cartTotal, clearCart } = useContext(CartContext);
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <h2 className="text-3xl font-bold text-apple-dark mb-4">Your cart is empty</h2>
        <button onClick={() => navigate('/')} className="text-apple-blue hover:underline">
          Return to Store
        </button>
      </div>
    );
  }

  const handleSuccess = (orderId) => {
    clearCart();
    alert("Payment Successful! Order Confirmed: " + orderId);
    navigate('/');
  };

  return (
    <div className="pb-20 pt-12 animate-fade-in-up">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-apple-dark">Secure Checkout</h1>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Side: Order Summary */}
        <div className="glass-card p-8 flex flex-col h-full">
          <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
          
          <div className="flex-1 overflow-y-auto pr-4 space-y-6">
            {cartItems.map((item) => (
              <div key={item.product._id} className="flex gap-4 items-center border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                <img src={item.product.imgUrl} alt={item.product.name} className="w-20 h-20 object-contain mix-blend-multiply" />
                <div className="flex-1">
                  <h3 className="font-semibold text-apple-dark line-clamp-1">{item.product.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">Qty: {item.quantity}</p>
                </div>
                <div className="font-bold text-lg">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-xl font-medium text-gray-600">Total</span>
              <span className="text-3xl font-bold text-apple-blue">${cartTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Payment Form */}
        <div className="glass-card p-8 h-fit">
          <h2 className="text-2xl font-bold mb-2">Payment Details</h2>
          <p className="text-gray-500 text-sm mb-8">Powered by Stripe SSL Encryption</p>
          
          <Elements stripe={stripePromise}>
            <CheckoutForm cartItems={cartItems} totalAmount={cartTotal} onSuccess={handleSuccess} />
          </Elements>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
