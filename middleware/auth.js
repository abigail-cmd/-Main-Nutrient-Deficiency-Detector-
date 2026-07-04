
// middleware/auth.js

function requireAdminAccess(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }

  return res.redirect("/admin/login");
}

module.exports = {
  requireAdminAccess,
};