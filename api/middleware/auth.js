import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  // Check for token in cookies or Authorization header
  const cookieToken = req.cookies?.accessToken;
  const headerToken = req.headers.authorization?.split(" ")[1];
  const token = cookieToken || headerToken;
  
  if (!token) {
    console.log("No token found in request");
    return res.status(401).json("Not Authenticated");
  }

  try {
    const decoded = jwt.verify(token, "secretkey");
    req.userInfo = decoded;
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    return res.status(403).json("Token is not valid");
  }
};


