import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    // Check for token in cookies or Authorization header
    const cookieToken = req.cookies?.accessToken;
    const headerToken = req.headers.authorization?.split(" ")[1];
    const token = cookieToken || headerToken;
    
    if (!token) {
      console.log("No token found in request");
      return res.status(401).json("Not authenticated!");
    }

    jwt.verify(token, "secretkey", (err, userInfo) => {
      if (err) {
        console.log("Token verification failed:", err.message);
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

