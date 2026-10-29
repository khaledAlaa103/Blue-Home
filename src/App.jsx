import { Navigate, Route, Routes } from 'react-router-dom'
import { PublicLayout } from './components/Layout'
import { RequireAdmin } from './auth'
import Home from './pages/Home'
import ProjectDetail from './pages/ProjectDetail'
import Listings from './pages/Listings'
import PropertyDetail from './pages/PropertyDetail'
import About from './pages/About'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'
import Login from './pages/admin/Login'
import Signup from './pages/Signup'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import ListingsAdmin from './pages/admin/ListingsAdmin'
import AreasAdmin from './pages/admin/AreasAdmin'
import CustomersAdmin from './pages/admin/CustomersAdmin'
import InquiriesAdmin from './pages/admin/InquiriesAdmin'
import TestimonialsAdmin from './pages/admin/TestimonialsAdmin'
import SettingsAdmin from './pages/admin/SettingsAdmin'

export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      <Route path="/admin" element={<RequireAdmin />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="properties" element={<ListingsAdmin key="properties" section="properties" />} />
          <Route path="projects" element={<Navigate to="/admin/properties" replace />} />
          <Route path="listings" element={<ListingsAdmin key="listings" />} />
          <Route path="areas" element={<AreasAdmin />} />
          <Route path="customers" element={<CustomersAdmin />} />
          <Route path="inquiries" element={<InquiriesAdmin />} />
          <Route path="testimonials" element={<TestimonialsAdmin />} />
          <Route path="settings" element={<SettingsAdmin />} />
        </Route>
      </Route>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="properties" element={<Listings key="properties" group="properties" title="العقارات" />} />
        <Route path="projects" element={<Navigate to="/properties" replace />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="units" element={<Listings key="units" group="units" title="الوحدات" />} />
        <Route path="lands" element={<Listings key="lands" group="lands" title="الأراضي" />} />
        <Route path="search" element={<Listings key="all" group="all" title="البحث العقاري" />} />
        <Route path="property/:id" element={<PropertyDetail />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
