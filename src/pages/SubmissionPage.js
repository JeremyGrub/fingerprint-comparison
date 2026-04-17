// src/pages/SubmissionPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import emailjs from 'emailjs-com';
import Header from '../components/Header';
import Footer from '../components/Footer';

const people = [
  { id: 1, name: 'Person 1' },
  { id: 2, name: 'Person 2' },
  { id: 3, name: 'Person 3' },
];

const fingers = Array.from({ length: 10 }, (_, i) => `Finger ${i + 1}`);

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  in:      { opacity: 1, y: 0 },
  out:     { opacity: 0, y: -10 },
};

const SubmissionPage = () => {
  const { caseId } = useParams();
  const navigate   = useNavigate();

  const STORAGE_KEY = `lla_case_${caseId}_decisions`;

  const [formData, setFormData] = useState({
    name:    '',
    email:   '',
    latents: Array(5).fill(null).map(() => ({ person: '', finger: '' })),
  });

  const [popupVisible,          setPopupVisible]          = useState(false);
  const [missingInfoPopup,      setMissingInfoPopup]      = useState(false);
  const [missingDecisionsPopup, setMissingDecisionsPopup] = useState(false);

  // Prefill from ComparisonPage decisions
  useEffect(() => {
    try {
      const stored             = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      const identifiedByLatent = stored.identifiedByLatent || {};
      const decisions          = stored.decisions          || {};
      const expectedTotal      = people.length * 10; // 30

      const prefilledLatents = Array(5).fill(null).map((_, i) => {
        const latentNum  = i + 1;
        const latentKey  = `latent:${latentNum}`;
        const found      = identifiedByLatent[latentKey];

        const excludedCount = Object.entries(decisions).reduce((count, [key, value]) => {
          const isThisLatent = key.includes(`case:${caseId}|latent:${latentNum}|`);
          if (isThisLatent && value === 'exclude') return count + 1;
          return count;
        }, 0);

        const isExcludeAll = !found && excludedCount === expectedTotal;

        if (isExcludeAll) return { person: 'exclude_all', finger: 'N/A' };
        if (found) {
          return {
            person: String(found.personId ?? ''),
            finger: found.fingerIndex ? `Finger ${found.fingerIndex}` : '',
          };
        }
        return { person: '', finger: '' };
      });

      setFormData((prev) => ({ ...prev, latents: prefilledLatents }));
    } catch (e) {
      console.log('No prefill available:', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const handleInputChange = (index, field, value) => {
    const newLatents = formData.latents.slice();
    newLatents[index] = { ...newLatents[index], [field]: value };
    if (field === 'person' && value === 'exclude_all') newLatents[index].finger = 'N/A';
    if (field === 'person' && value !== 'exclude_all' && newLatents[index].finger === 'N/A') {
      newLatents[index].finger = '';
    }
    setFormData({ ...formData, latents: newLatents });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const formatLatentLine = (latent) => {
    if (latent.person === 'exclude_all') return 'Exclude All';
    return `Person ${latent.person} / ${latent.finger}`;
  };

  const showTempPopup = (setter) => {
    setter(true);
    setTimeout(() => setter(false), 3000);
  };

  const validateBeforeSubmit = () => {
    const nameOk  = formData.name.trim().length > 0;
    const emailOk = formData.email.trim().length > 0;
    if (!nameOk || !emailOk) { showTempPopup(setMissingInfoPopup); return false; }
    const latentsOk = formData.latents.every((l) => {
      if (!l.person) return false;
      if (l.person === 'exclude_all') return true;
      return Boolean(l.finger);
    });
    if (!latentsOk) { showTempPopup(setMissingDecisionsPopup); return false; }
    return true;
  };

  const sendEmail = () => {
    const templateParams = {
      case_id: caseId,
      name:    formData.name,
      email:   formData.email,
      latent1: formatLatentLine(formData.latents[0]),
      latent2: formatLatentLine(formData.latents[1]),
      latent3: formatLatentLine(formData.latents[2]),
      latent4: formatLatentLine(formData.latents[3]),
      latent5: formatLatentLine(formData.latents[4]),
    };
    emailjs
      .send('latent_service', 'template_case', templateParams, 'bGV_7SYjtIC_CRYg1')
      .then(
        (response) => {
          console.log('SUCCESS!', response.status, response.text);
          setPopupVisible(true);
          setTimeout(() => setPopupVisible(false), 3000);
        },
        (error) => { console.log('FAILED...', error); }
      );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateBeforeSubmit()) return;
    sendEmail();
  };

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

      <main className="submission-page">

        <motion.div
          className="submission-header"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.06, ease: 'easeOut' }}
        >
          <p className="eyebrow" style={{ marginBottom: '0.4rem' }}>
            Case {String(caseId).padStart(3, '0')}
          </p>
          <h2 className="submission-title">Submit Your Results</h2>
          <p className="submission-subtitle">
            Review your conclusions below — they have been pre-filled from your comparison work.
          </p>
        </motion.div>

        <form className="submission-form" onSubmit={handleSubmit}>

          {/* Personal information — spans all columns */}
          <motion.div
            className="form-card form-card-personal"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.10 }}
          >
            <p className="form-card-eyebrow">Student Info</p>
            <h3>Personal Information</h3>
            <div className="personal-info-grid">
              <div className="form-row">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div className="form-row">
                <label htmlFor="email">Instructor's Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="instructor@school.edu"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>
          </motion.div>

          {/* Latent cards */}
          {formData.latents.map((latent, index) => {
            const isExcludeAll = latent.person === 'exclude_all';
            return (
              <motion.div
                key={index}
                className="form-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.26, delay: 0.14 + index * 0.05 }}
              >
                <p className="form-card-eyebrow">Latent {index + 1}</p>
                <h3>Conclusion</h3>

                <div className="form-row">
                  <label>Person</label>
                  <select
                    value={latent.person}
                    onChange={(e) => handleInputChange(index, 'person', e.target.value)}
                  >
                    <option value="">— Select —</option>
                    <option value="exclude_all">Exclude All</option>
                    {people.map((person) => (
                      <option key={person.id} value={person.id}>{person.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <label>Finger</label>
                  <select
                    value={latent.finger}
                    onChange={(e) => handleInputChange(index, 'finger', e.target.value)}
                    disabled={isExcludeAll}
                  >
                    <option value="">{isExcludeAll ? 'N/A' : '— Select —'}</option>
                    {isExcludeAll ? (
                      <option value="N/A">N/A</option>
                    ) : (
                      fingers.map((finger, i) => (
                        <option key={i} value={finger}>{finger}</option>
                      ))
                    )}
                  </select>
                </div>
              </motion.div>
            );
          })}

        </form>

        <motion.div
          className="submission-actions"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.45 }}
        >
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate(`/comparison/${caseId}`)}
          >
            ← Back to Comparison
          </button>
          <button type="button" className="submit-button" onClick={handleSubmit}>
            Submit Results
          </button>
        </motion.div>

        {/* Popups */}
        {popupVisible          && <div className="popup">Results sent successfully!</div>}
        {missingInfoPopup      && <div className="popup popup-danger">Missing personal information.</div>}
        {missingDecisionsPopup && <div className="popup popup-warn">Missing decisions for one or more latents.</div>}

      </main>

      <Footer />
    </motion.div>
  );
};

export default SubmissionPage;
