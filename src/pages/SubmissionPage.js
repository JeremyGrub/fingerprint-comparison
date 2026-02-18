// src/pages/SubmissionPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import emailjs from 'emailjs-com';
import Header from '../components/Header';
import Footer from '../components/Footer';

const people = [
  { id: 1, name: 'Person 1' },
  { id: 2, name: 'Person 2' },
  { id: 3, name: 'Person 3' },
];

const fingers = Array.from({ length: 10 }, (_, i) => `Finger ${i + 1}`);

const SubmissionPage = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const STORAGE_KEY = `lla_case_${caseId}_decisions`;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    latents: Array(5)
      .fill(null)
      .map(() => ({ person: '', finger: '' })),
  });

  // success popup (existing)
  const [popupVisible, setPopupVisible] = useState(false);

  // NEW: validation popups
  const [missingInfoPopup, setMissingInfoPopup] = useState(false);
  const [missingDecisionsPopup, setMissingDecisionsPopup] = useState(false);

  // Prefill from ComparisonPage Identify decisions + auto Exclude All
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      const identifiedByLatent = stored.identifiedByLatent || {};
      const decisions = stored.decisions || {};

      const expectedTotal = people.length * 10; // 3 persons x 10 fingers = 30

      const prefilledLatents = Array(5)
        .fill(null)
        .map((_, i) => {
          const latentNum = i + 1;
          const latentKey = `latent:${latentNum}`;
          const found = identifiedByLatent[latentKey];

          // Count excluded combos for this latent (for auto Exclude All)
          const excludedCount = Object.entries(decisions).reduce((count, [key, value]) => {
            const isThisLatent = key.includes(`case:${caseId}|latent:${latentNum}|`);
            if (isThisLatent && value === 'exclude') return count + 1;
            return count;
          }, 0);

          const isExcludeAll = !found && excludedCount === expectedTotal;

          if (isExcludeAll) {
            return { person: 'exclude_all', finger: 'N/A' };
          }

          if (found) {
            return {
              person: String(found.personId ?? ''),
              finger: found.fingerIndex ? `Finger ${found.fingerIndex}` : '',
            };
          }

          return { person: '', finger: '' };
        });

      setFormData((prev) => ({
        ...prev,
        latents: prefilledLatents,
      }));
    } catch (e) {
      console.log('No prefill available:', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const handleInputChange = (index, field, value) => {
    const newLatents = formData.latents.slice();
    newLatents[index] = { ...newLatents[index], [field]: value };

    // If user chooses Exclude All, force finger to N/A
    if (field === 'person' && value === 'exclude_all') {
      newLatents[index].finger = 'N/A';
    }

    // If user switches away from Exclude All, clear finger for safety
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

  // ✅ Validation checks (no hand-holding, just "missing")
  const validateBeforeSubmit = () => {
    const nameOk = formData.name.trim().length > 0;
    const emailOk = formData.email.trim().length > 0;

    if (!nameOk || !emailOk) {
      showTempPopup(setMissingInfoPopup);
      return false;
    }

    const latentsOk = formData.latents.every((l) => {
      if (!l.person) return false;
      if (l.person === 'exclude_all') return true; // finger can be N/A
      return Boolean(l.finger);
    });

    if (!latentsOk) {
      showTempPopup(setMissingDecisionsPopup);
      return false;
    }

    return true;
  };

  const sendEmail = () => {
    const templateParams = {
      case_id: caseId,
      name: formData.name,
      email: formData.email,
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
        (error) => {
          console.log('FAILED...', error);
        }
      );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // ✅ block send if missing anything
    if (!validateBeforeSubmit()) return;

    sendEmail();
  };

  return (
    <div>
      <Header />
      <main className="submission-page">
        <h2 className="submission-title">Submit Your Results for Case {caseId}</h2>

        <form className="submission-form" onSubmit={handleSubmit}>
          <div className="form-card">
            <h3>Personal Information</h3>
            <div>
              <label>Name:</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} />
            </div>
            <div>
              <label>Professor&apos;s Email:</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} />
            </div>
          </div>

          {formData.latents.map((latent, index) => {
            const isExcludeAll = latent.person === 'exclude_all';

            return (
              <div key={index} className="form-card">
                <h3>Latent {index + 1}</h3>

                <div>
                  <label>Person:</label>
                  <select value={latent.person} onChange={(e) => handleInputChange(index, 'person', e.target.value)}>
                    <option value="">Select Person</option>
                    <option value="exclude_all">Exclude All</option>
                    {people.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Finger:</label>
                  <select
                    value={latent.finger}
                    onChange={(e) => handleInputChange(index, 'finger', e.target.value)}
                    disabled={isExcludeAll}
                  >
                    <option value="">{isExcludeAll ? 'N/A' : 'Select Finger'}</option>
                    {isExcludeAll ? (
                      <option value="N/A">N/A</option>
                    ) : (
                      fingers.map((finger, i) => (
                        <option key={i} value={finger}>
                          {finger}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            );
          })}
        </form>

        <div className="submission-actions">
          <button type="button" className="secondary-button" onClick={() => navigate(`/comparison/${caseId}`)}>
            Back to Comparisons
          </button>

          <button type="button" className="submit-button" onClick={handleSubmit}>
            Submit
          </button>
        </div>

        {/* ✅ Popups */}
        {popupVisible && <div className="popup">Results have been successfully sent!</div>}

        {missingInfoPopup && <div className="popup popup-danger">Missing personal information.</div>}

        {missingDecisionsPopup && <div className="popup popup-warn">Missing decisions for one or more latents.</div>}
      </main>
      <Footer />
    </div>
  );
};

export default SubmissionPage;
