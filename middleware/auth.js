
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


// // middleware/auth.js

// function requireAdminAccess(req, res, next) {
//   const enteredPassword =
//     req.query.adminKey ||
//     req.body?.adminKey ||
//     req.headers["x-admin-key"];

//   const adminPassword = process.env.ADMIN_PASSWORD || "abiadmin123";

//   if (enteredPassword === adminPassword) {
//     return next();
//   }

//   return res.status(403).send(`
//     <html>
//       <head>
//         <title>Access Denied</title>
//         <style>
//           body {
//             font-family: Arial, sans-serif;
//             background: #f8fafc;
//             display: flex;
//             align-items: center;
//             justify-content: center;
//             min-height: 100vh;
//             margin: 0;
//           }
//           .box {
//             background: white;
//             padding: 30px;
//             border-radius: 16px;
//             box-shadow: 0 10px 30px rgba(0,0,0,0.08);
//             max-width: 420px;
//             text-align: center;
//           }
//           h1 {
//             margin-bottom: 10px;
//             color: #0f172a;
//           }
//           p {
//             color: #475569;
//             line-height: 1.6;
//           }
//           code {
//             background: #f1f5f9;
//             padding: 4px 8px;
//             border-radius: 8px;
//           }
//         </style>
//       </head>
//       <body>
//         <div class="box">
//           <h1>Access Denied</h1>
//           <p>This page is protected.</p>
//           <p>Add the admin key in the URL like:</p>
//           <p><code>?adminKey=yourpassword</code></p>
//         </div>
//       </body>
//     </html>
//   `);
// }

// module.exports = {
//   requireAdminAccess,
// };