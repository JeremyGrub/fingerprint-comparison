import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const LandingPage = () => {
    const navigate = useNavigate();

    const goToMockCases = () => {
        navigate('/mock-cases');
    };

    return (
        <div>
            <Header />
            <main className="landing-page-container">
                <div className="landing-page-content">
                    <h2 className="black-text">Welcome to the Latent Lab</h2>
                    <p className="landing-page-paragraph">
                        This website is intended for Forensic Science students who are learning to compare fingerprints.
                        Latent print examiners will typically do comparisons on-screen whether it’s in Photoshop or another type of software.
                        Most schools teach how to do comparisons on paper with magnifiers. This website will allow you to compare fingerprints 
                        on screen and go through a series of mock cases.
                    </p>
                    <button className="mock-case-button" onClick={goToMockCases}>Go to Mock Cases</button>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default LandingPage;
