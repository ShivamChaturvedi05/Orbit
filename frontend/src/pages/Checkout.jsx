import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { AuthContext } from '../context/AuthContext';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ product }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);

    const cardElement = elements.getElement(CardElement);
    const { error: stripeError, token: stripeToken } = await stripe.createToken(cardElement);

    if (stripeError) {
      setError(stripeError.message);
      setLoading(false);
      return;
    }

    try {
      // Send the token to our Payment Service via API Gateway
      const res = await axios.post('http://localhost:3000/api/payments/charge', {
        amount: product.price,
        source: stripeToken.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        alert("Payment Successful! Order ID: " + res.data.chargeId);
        navigate('/'); // Go back to home
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border rounded-xl bg-white shadow-sm border-gray-100">
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#333',
              '::placeholder': { color: '#aab7c4' },
            },
          },
        }} />
      </div>
      {error && <div className="text-red-500 text-sm font-semibold">{error}</div>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-apple-blue text-white py-4 rounded-xl font-bold tracking-wide hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Processing...' : `Pay $${product.price}`}
      </button>
    </form>
  );
};

const Checkout = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/inventory/public/${id}`);
        setProduct(res.data);
      } catch (err) {
        console.error("Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <div className="text-center mt-20 font-bold text-apple-blue">Loading secure checkout...</div>;
  if (!product) return <div className="text-center mt-20 text-red-500 font-bold">Product not found.</div>;

  return (
    <div className="max-w-5xl mx-auto px-6 animate-fade-in-up">
      <h1 className="text-4xl font-bold tracking-tight mb-8">Secure Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left Side: Product Summary */}
        <div className="glass-card p-8 flex flex-col items-center justify-center text-center">
          <img src={product.imgUrl} alt={product.name} className="h-64 object-contain mb-8 mix-blend-multiply" />
          <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
          <p className="text-gray-500 mb-6">{product.description}</p>
          <div className="text-4xl font-bold tracking-tight text-apple-blue">${product.price}</div>
        </div>

        {/* Right Side: Payment Form */}
        <div className="glass-card p-8 flex flex-col justify-center">
          <h2 className="text-2xl font-bold mb-2">Payment Details</h2>
          <p className="text-sm text-gray-500 mb-8">Powered by Stripe SSL Encryption</p>
          <Elements stripe={stripePromise}>
            <CheckoutForm product={product} />
          </Elements>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
