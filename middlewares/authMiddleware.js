import jwt from "jsonwebtoken";

// Middleware untuk memverifikasi token JWT
const authMiddleware = (req, res, next) => {
  // Ambil token dari header "Authorization"
  const token = req.headers['authorization']?.split(' ')[1]; 

  // Jika token tidak ada, kirimkan respons error
  if (!token) {
    return res.status(403).json({ message: "Token is required" });
  }

  try {
    // Verifikasi token menggunakan secret key yang ada di environment variable
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded; // Simpan informasi pengguna yang didekodekan di request
    next(); // Lanjutkan ke route handler berikutnya
  } catch (error) {
    // Jika token invalid atau expired
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default authMiddleware;
