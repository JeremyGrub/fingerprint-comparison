import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import MockCases from './pages/MockCases';
import ComparisonPage from './pages/ComparisonPage';
import SubmissionPage from './pages/SubmissionPage'; // Add this import

const App = () => {
    return (
        <Router>
            <Routes>
                <Route exact path="/" element={<LandingPage />} />
                <Route path="/mock-cases" element={<MockCases />} />
                <Route path="/comparison/:caseId" element={<ComparisonPage />} />
                <Route path="/submission/:caseId" element={<SubmissionPage />} />
            </Routes>
        </Router>
    );
};

export default App;

