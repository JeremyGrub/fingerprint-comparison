import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './pages/LandingPage';
import MockCases from './pages/MockCases';
import ComparisonPage from './pages/ComparisonPage';
import SubmissionPage from './pages/SubmissionPage';

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route exact path="/" element={<LandingPage />} />
        <Route path="/mock-cases" element={<MockCases />} />
        <Route path="/comparison/:caseId" element={<ComparisonPage />} />
        <Route path="/submission/:caseId" element={<SubmissionPage />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
};

export default App;
