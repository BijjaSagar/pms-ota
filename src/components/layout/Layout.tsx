import { Outlet, useLocation } from 'react-router-dom'
import { AssistantChat } from '../chat/AssistantChat'
import { Footer } from './Footer'
import { Navbar } from './Navbar'
import { ScrollToTop } from './ScrollToTop'

export function Layout() {
  const location = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-brand focus:px-5 focus:py-3 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to content
      </a>
      <ScrollToTop />
      <Navbar />
      <main id="main-content" key={location.pathname} className="flex-1 animate-fade-in">
        <Outlet />
      </main>
      <Footer />
      <AssistantChat />
    </div>
  )
}
