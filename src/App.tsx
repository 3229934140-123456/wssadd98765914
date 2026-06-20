import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Home from '@/pages/Home'
import Depart from '@/pages/Depart'
import Transit from '@/pages/Transit'
import Alert from '@/pages/Alert'
import Handover from '@/pages/Handover'

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-dark-900 font-sans">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/depart/:taskId" element={<Depart />} />
          <Route path="/transit/:taskId" element={<Transit />} />
          <Route path="/alert/:taskId" element={<Alert />} />
          <Route path="/handover/:taskId" element={<Handover />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}
