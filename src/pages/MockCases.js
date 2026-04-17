import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';

const mockCases = [
  { id: 1, name: 'Case 1' },
  { id: 2, name: 'Case 2' },
  { id: 3, name: 'Case 3' },
];

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  in:      { opacity: 1, y: 0 },
  out:     { opacity: 0, y: -10 },
};

const MockCases = () => {
  return (
    <motion.div
      style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <Header />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}>
        <div className="split-container">

          {/* LEFT — Instructions */}
          <motion.section
            className="split-card"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.30, delay: 0.08, ease: 'easeOut' }}
          >
            <p className="split-card-eyebrow">How it works</p>
            <h2 className="split-card-title">What You Will Be Doing</h2>
            <ul className="split-card-list">
              <li className="list-space">Select one of the mock cases on the right to begin</li>
              <li className="list-space">Each case has <strong>3 suspects</strong> (known prints) and <strong>5 latent prints</strong> from the scene</li>
              <li className="list-space">Use the dropdowns to navigate between suspects and individual fingers</li>
              <li className="list-space">Click directly on images to place dot markers on minutiae and characteristics</li>
              <li className="list-space">Use <strong>Identify</strong> to match a latent to a person and finger, or <strong>Exclude</strong> to rule them out</li>
              <li className="list-space">Once you have a conclusion for all 5 latents, click <strong>Go to Submissions</strong></li>
              <li className="list-space">Your results will be emailed to your instructor who holds the answers</li>
              <li className="list-space">Good luck — examine carefully!</li>
            </ul>
          </motion.section>

          {/* RIGHT — Case selection */}
          <motion.section
            className="split-card split-right-card"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.30, delay: 0.12, ease: 'easeOut' }}
          >
            <p className="split-card-eyebrow">Select a file</p>
            <h2 className="split-card-title">Mock Cases</h2>
            <ul className="mock-cases-list">
              {mockCases.map((mockCase, i) => (
                <motion.li
                  key={mockCase.id}
                  className="mock-case-item"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: 0.18 + i * 0.06, ease: 'easeOut' }}
                >
                  <Link to={`/comparison/${mockCase.id}`} className="mock-case-button">
                    <span className="case-btn-inner">
                      <span className="case-num-badge">{mockCase.id.toString().padStart(2, '0')}</span>
                      {mockCase.name}
                    </span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.section>

        </div>
      </main>
      <Footer />
    </motion.div>
  );
};

export default MockCases;
