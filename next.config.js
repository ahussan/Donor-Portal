/** @type {import('next').NextConfig} */
const nextConfig = {
  // Old login-era URLs now land on the single public page
  async redirects() {
    return [
      { source: '/collection', destination: '/', permanent: true },
      { source: '/dashboard', destination: '/', permanent: true },
    ]
  },
}
module.exports = nextConfig
