import jwt from "jsonwebtoken";

export const authUser = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      message: "User Not Authenticated",
      success: false,
      err: "No token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Unauthorized",
      success: false,
      err: "Invalid token",
    });
  }
};