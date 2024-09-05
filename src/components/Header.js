import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
    return (
        <header className="header-container">
            <h1 className="header-title">Latent Lab Academy</h1>
            <nav className="header-nav">
                <Link to="/" className="home-link">Home</Link>
            </nav>
        </header>
    );
};

export default Header;
