/**
 * @file        authMiddleware.js
 * @module      AuthMiddleware
 * @description Authentication middleware using JWT.
 * @layer       middleware
 * @author      Architect Agent
 * @version     1.0.0
 */

/**
 * @function  verifyToken
 * @summary   Express middleware function to verify JWT from headers
 * @param     {object}    req   - Express request object
 * @param     {object}    res   - Express response object
 * @param     {function}  next  - Express next middleware function
 * @returns   {void}
 * @throws    {Error} If authorization fails
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  // Token verification placeholder
  const token = authHeader.split(' ')[1];
  if (token === 'mock-valid-token') {
    req.user = { id: 1, role: 'customer' };
    return next();
  }

  return res.status(403).json({ error: 'Invalid or expired token.' });
}

module.exports = {
  verifyToken,
};
