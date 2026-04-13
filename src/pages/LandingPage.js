import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  in:      { opacity: 1, y: 0 },
  out:     { opacity: 0, y: -10 },
};

const LandingPage = () => {
  const navigate = useNavigate();

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
      <main className="landing-page-container">
        <motion.div
          className="landing-page-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08, ease: 'easeOut' }}
        >
          <div className="landing-card">
            <div className="landing-badge">
              <span className="landing-badge-dot" />
              Forensic Training Tool
            </div>

            <h2 className="landing-heading">
              Latent Print<br />
              <span>Comparison Lab</span>
            </h2>

            <div className="landing-divider" />

            <p className="landing-page-paragraph">
              A professional training environment for forensic science students learning
              latent print examination. Work through realistic mock cases — compare
              known prints against latents, annotate minutiae, and submit your findings
              just like a real examiner.
            </p>

            <button className="btn btn-lg" onClick={() => navigate('/mock-cases')}>
              Open Case Files
            </button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </motion.div>
  );
};

export default LandingPage;
