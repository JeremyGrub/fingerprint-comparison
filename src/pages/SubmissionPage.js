// src/pages/SubmissionPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import emailjs from 'emailjs-com';
import Header from '../components/Header';
import Footer from '../components/Footer';

const people = [
  { id: 1, name: 'Person 1' },
  { id: 2, name: 'Person 2' },
  { id: 3, name: 'Person 3' }
];

const fingers = Array.from({ length: 10 }, (_, i) => `Finger ${i + 1}`);

const SubmissionPage = () => {
  const { caseId } = useParams();

  const STORAGE_KEY = `lla_case_${caseId}_decisions`;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    latents: Array(5).fill(null).map(() => ({ person: '', finger: '' })),
  });

  const [popupVisible, setPopupVisible] = useState(false);

  // ✅ Prefill from ComparisonPage Identify decisions
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      const identifiedByLatent = stored.identifiedByLatent || {};

      // build a new latents array prefilled when available
      const prefilledLatents = Array(5).fill(null).map((_, i) => {
        const latentKey = `latent:${i + 1}`;
        const found = identifiedByLatent[latentKey];

        if (!found) return { person: '', finger: '' };

        return {
          person: String(found.personId ?? ''),
          finger: found.fingerIndex ? `Finger ${found.fingerIndex}` : '',
        };
      });

      setFormData((prev) => ({
        ...prev,
        latents: prefilledLatents,
      }));
    } catch (e) {
      // if parsing fails, just don't prefill
      console.log('No prefill available:', e);
    }
  }, [STORAGE_KEY]);

  const handleInputChange = (index, field, value) => {
    const newLatents = formData.latents.slice();
    newLatents[index] = { ...newLatents[index], [field]: value };
    setFormData({ ...formData, latents: newLatents });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const sendEmail = () => {
    const templateParams = {
      case_id: caseId,
      name: formData.name,
      email: formData.email,
      latent1: `Person ${formData.latents[0].person} / ${formData.latents[0].finger}`,
      latent2: `Person ${formData.latents[1].person} / ${formData.latents[1].finger}`,
      latent3: `Person ${formData.latents[2].person} / ${formData.latents[2].finger}`,
      latent4: `Person ${formData.latents[3].person} / ${formData.latents[3].finger}`,
      latent5: `Person ${formData.latents[4].person} / ${formData.latents[4].finger}`,
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
    sendEmail();
  };

  const navigate = useNavigate();

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
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div>
              <label>Professor&apos;s Email:</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
          </div>

          {formData.latents.map((latent, index) => (
            <div key={index} className="form-card">
              <h3>Latent {index + 1}</h3>

              <div>
                <label>Person:</label>
                <select
                  value={latent.person}
                  onChange={(e) => handleInputChange(index, 'person', e.target.value)}
                  required
                >
                  <option value="">Select Person</option>
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
                  required
                >
                  <option value="">Select Finger</option>
                  {fingers.map((finger, i) => (
                    <option key={i} value={finger}>
                      {finger}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </form>

        <div className="submission-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate(`/comparison/${caseId}`)}
          >
            Back to Comparisons
          </button>

          <button
            type="submit"
            className="submit-button"
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>


        {popupVisible && <div className="popup">Results have been successfully sent!</div>}
      </main>
      <Footer />
    </div>
  );
};

export default SubmissionPage;
