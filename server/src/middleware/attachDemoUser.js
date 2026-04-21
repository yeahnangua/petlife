export function attachDemoUser(req, _res, next) {
  req.user = { id: 'u_demo_001' }
  next()
}
