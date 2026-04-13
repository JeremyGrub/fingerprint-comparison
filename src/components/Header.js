import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const steps = [
  { label: 'Home',    path: '/' },
  { label: 'Cases',   path: '/mock-cases' },
  { label: 'Compare', path: '/comparison' },
  { label: 'Submit',  path: '/submission' },
];

const Header = () => {
  const location = useLocation();

  const currentStep = (() => {
    if (location.pathname.startsWith('/submission')) return 3;
    if (location.pathname.startsWith('/comparison')) return 2;
    if (location.pathname.startsWith('/mock-cases'))  return 1;
    return 0;
  })();

  return (
    <header>
      <div className="header-container">
        {/* Brand */}
        <Link to="/" className="header-brand" style={{ textDecoration: 'none' }}>
          <div className="header-logo-mark">LL</div>
          <h1 className="header-title">Latent Lab</h1>
        </Link>

        {/* Progress steps */}
        <nav className="progress-steps" aria-label="Workflow steps">
          {steps.map((step, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div className="progress-step-line" aria-hidden="true" />}
              <div
                className={[
                  'progress-step',
                  i <= currentStep ? 'step-active'  : '',
                  i === currentStep ? 'step-current' : '',
                ].join(' ')}
              >
                <span className="progress-step-num">{i + 1}</span>
                <span className="progress-step-label">{step.label}</span>
              </div>
            </React.Fragment>
          ))}
        </nav>

        {/* Home link */}
        <nav className="header-nav" aria-label="Site navigation">
          <Link to="/" className="home-link">
            ← Home
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
