import { Route, Routes } from 'react-router-dom'
import { PublicLayout } from './components/Layout'
import { RequireAdmin } from './auth'
import Home from './pages/Home'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Listings from './pages/Listings'
import PropertyDetail from './pages/PropertyDetail'
import About from './pages/About'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'
import Login from './pages/admin/Login'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import ProjectsAdmin from './pages/admin/ProjectsAdmin'
import ListingsAdmin from './pages/admin/ListingsAdmin'
import AreasAdmin from './pages/admin/AreasAdmin'
import InquiriesAdmin from './pages/admin/InquiriesAdmin'
import TestimonialsAdmin from './pages/admin/TestimonialsAdmin'
import SettingsAdmin from './pages/admin/SettingsAdmin'

export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin" element={<RequireAdmin />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<ProjectsAdmin />} />
          <Route path="listings" element={<ListingsAdmin />} />
          <Route path="areas" element={<AreasAdmin />} />
          <Route path="inquiries" element={<InquiriesAdmin />} />
          <Route path="testimonials" element={<TestimonialsAdmin />} />
          <Route path="settings" element={<SettingsAdmin />} />
        </Route>
      </Route>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="units" element={<Listings group="units" title="الوحدات" />} />
        <Route path="lands" element={<Listings group="lands" title="الأراضي" />} />
        <Route path="search" element={<Listings group="all" title="البحث العقاري" />} />
        <Route path="property/:id" element={<PropertyDetail />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
