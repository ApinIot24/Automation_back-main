const roleAndPermissionMiddleware = (requiredRoles, requiredPermissions) => (req, res, next) => {
    const userRoles = req.user?.roles || []; // Ambil peran pengguna dari `req.user`
    const userPermissions = req.user?.permissions || []; // Ambil izin pengguna dari `req.user`
  
    // Periksa apakah pengguna memiliki salah satu dari peran yang diperlukan
    const hasRoleAccess = requiredRoles.some((role) => userRoles.includes(role));
  
    // Periksa apakah pengguna memiliki semua izin yang diperlukan
    const hasPermissionAccess = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );
  
    if (!hasRoleAccess || !hasPermissionAccess) {
      return res.status(403).json({ message: "Access denied: Insufficient permissions" });
    }
  
    next(); // Lanjutkan ke middleware berikutnya
  };
  
  export default roleAndPermissionMiddleware;
  