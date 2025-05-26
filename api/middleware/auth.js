import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    // Check for token in cookies or Authorization header
    const cookieToken = req.cookies?.accessToken;
    const headerToken = req.headers.authorization?.split(" ")[1];
    const token = cookieToken || headerToken;
    
    // Public routes that should work for guests
    const isPublicGetRoute = req.method === 'GET' && (
      req.path === '/' || 
      req.path.startsWith('/posts') ||
      req.path.startsWith('/events') ||
      req.path.startsWith('/forums') ||
      req.path.startsWith('/users/find/')
    );
    
    // If no token and it's a public route, proceed as guest
    if (!token) {
      if (isPublicGetRoute) {
        req.userInfo = { id: 'guest', role: 'guest' };
        return next();
      }
      
      console.log("No token found in request");
      return res.status(401).json("Not authenticated!");
    }

    // If token starts with "guest_", it's a guest token
    if (token.startsWith('guest_')) {
      req.userInfo = { id: token, role: 'guest' };
      
      // Allow guests to access public routes
      if (isPublicGetRoute) {
        return next();
      } else {
        return res.status(403).json("Guests cannot perform this action");
      }
    }

    // For regular tokens
    jwt.verify(token, "secretkey", (err, userInfo) => {
      if (err) {
        console.log("Token verification failed:", err.message);
        
        // If token verification fails but it's a public route, proceed as guest
        if (isPublicGetRoute) {
          req.userInfo = { id: 'guest', role: 'guest' };
          return next();
        }
        
        return res.status(403).json("Token is not valid!");
      }
      
      req.userInfo = userInfo;
      next();
    });
  } catch (error) {
    console.error("Error in verifyToken middleware:", error);
    return res.status(500).json("Authentication error");
  }
};



