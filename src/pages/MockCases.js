import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const mockCases = [
    { id: 1, name: 'Case 1' },
    { id: 2, name: 'Case 2' },
    { id: 3, name: 'Case 3' },
];

const MockCases = () => {
    return (
        <div>
            <Header />
            <main>
                <div className="split-container">
                    <div className="split-left">
                        <h2 className="black-text">What You Will Be Doing</h2>
                        <ul>
                        <li className="list-space">First select one of the mock cases on the right</li>
                        <li className="list-space">Inside the mock case, there are 3 “Suspects” on the left and 5 latent on the right</li>
                        <li className="list-space">You can use the drop downs to go through all the prints to do your comparisons</li>
                        <li className="list-space">You can click on the images to place dots on the minutiae or any characteristics you want to mark</li>
                        <li className="list-space">When you Identify a Latent, record the person and finger it matches too</li>
                        <li className="list-space">Once you have a conclusion for all the latents then click the “Go to Submissions” button to enter your results</li>
                        <li className="list-space">Results will be emailed to your professor who has the answers</li>
                        <li className="list-space">Good Luck! </li>
                        </ul>
                    </div>
                    <div className="split-right">
                        <h2>Mock Cases</h2>
                        <ul className="mock-cases-list">
                        {mockCases.map((mockCase) => (
                            <li key={mockCase.id} className="mock-case-item">
                            <Link to={`/comparison/${mockCase.id}`} className="mock-case-button">
                                {mockCase.name}
                            </Link>
                            </li>
                        ))}
                        </ul>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default MockCases;

