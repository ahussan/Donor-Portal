import './globals.css'

export const metadata = {
  title: 'Donor Collection',
  description: 'Donor management system',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
