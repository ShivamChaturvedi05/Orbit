const redisClient = require('../db/redis');

// Get Cart
const getCart = async (req, res) => {
  try {
    const { userId } = req.params;

    const callerId = req.headers['x-user-id'];
    if (callerId && callerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to access this cart' });
    }

    const cartData = await redisClient.get(`cart:${userId}`);
    if (cartData) {
      res.json({ cart: JSON.parse(cartData) });
    } else {
      res.json({ cart: [] });
    }
  } catch (error) {
    console.error('[Cart GET Error]', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Sync/Update Cart
const syncCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const { cart } = req.body;

    const callerId = req.headers['x-user-id'];
    if (callerId && callerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to modify this cart' });
    }

    if (!Array.isArray(cart)) {
      return res.status(400).json({ error: 'Cart must be an array' });
    }

    // Save cart to Redis
    await redisClient.set(`cart:${userId}`, JSON.stringify(cart), 'EX', 60 * 60 * 24 * 7);

    res.json({ success: true, message: 'Cart synced successfully' });
  } catch (error) {
    console.error('[Cart SYNC Error]', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const clearCart = async (req, res) => {
  try {
    const { userId } = req.params;

    const callerId = req.headers['x-user-id'];
    if (callerId && callerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to modify this cart' });
    }

    await redisClient.del(`cart:${userId}`);
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    console.error('[Cart CLEAR Error]', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { getCart, syncCart, clearCart };
