const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token || req.headers.authorization.split(' ')[0] !== 'Bearer') {
      return res.status(401).json({ error: 'No token provided or invalid token format' });
    }

    console.log('Received Token:', token);
    const { data: blacklistedTokens, error: blacklistError } = await supabase
      .from('blacklisted_tokens')
      .select('*')
      .eq('token', token);

    console.log('Blacklisted Tokens Check:', {
      blacklistedTokens,
      blacklistError
    });

    if (blacklistError) {
      console.error('Blacklist check error:', blacklistError);
      return res.status(500).json({ error: 'Error checking blacklisted token', details: blacklistError.message });
    }

    if (blacklistedTokens && blacklistedTokens.length > 0) {
      const decoded = jwt.decode(token);

      const { error: activeTokenRemovalError } = await supabase
        .from('active_tokens')
        .delete()
        .eq('user_id', decoded.userId)
        .eq('token', token);

      if (activeTokenRemovalError) {
        console.error('Error removing active token:', activeTokenRemovalError);
      }

      return res.status(401).json({ error: 'Token is invalid or expired' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    console.log('Decoded User:', req.user);

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired' });
    }
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Invalid token', details: error.message });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const isMerchant = (req, res, next) => {
  if (req.user.role !== 'merchant') {
    return res.status(403).json({ error: 'Merchant access required' });
  }
  next();
};

const isAdminOrMerchant = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'merchant') {
    return res.status(403).json({ error: 'Admin or Merchant access required' });
  }
  next();
};

module.exports = {
  authMiddleware,
  isAdmin,
  isMerchant,
  isAdminOrMerchant
};