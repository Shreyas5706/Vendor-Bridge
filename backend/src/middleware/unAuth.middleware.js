import jwt from "jsonwebtoken";

export const unauthUser = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return next(); // User is not logged in
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);

    return res.status(403).json({
      success: false,
      message: "You are already logged in",
    });
  } catch (err) {
    // Invalid/expired token, treat as unauthenticated
    next();
  }
};