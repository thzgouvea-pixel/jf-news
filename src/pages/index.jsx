import React from 'react';
import './styles.css';

const Navigation = () => {
    return (
        <header className="navbar">
            <h1>JF News</h1>
            <nav>
                <ul>
                    <li><a href="#">Home</a></li>
                    <li><a href="#">News</a></li>
                    <li><a href="#">Rankings</a></li>
                    <li><a href="#">Stats</a></li>
                    <li><a href="#">Polls</a></li>
                </ul>
            </nav>
        </header>
    );
};

const MatchCard = () => {
    return (
        <div className="card match-card">
            <h2>Next Duel</h2>
            {/* Match details here */}
        </div>
    );
};

const NewsCard = () => {
    return (
        <div className="card news-card">
            <h2>Latest News</h2>
            {/* News details here */}
        </div>
    );
};

const RankingCard = () => {
    return (
        <div className="card ranking-card">
            <h2>Rankings</h2>
            {/* Rankings details here */}
        </div>
    );
};

const StatsCard = () => {
    return (
        <div className="card stats-card">
            <h2>Stats</h2>
            {/* Stats details here */}
        </div>
    );
};

const PollCard = () => {
    return (
        <div className="card poll-card">
            <h2>Poll</h2>
            {/* Poll details here */}
        </div>
    );
};

const App = () => {
    return (
        <div className="app">
            <Navigation />
            <main>
                <MatchCard />
                <NewsCard />
                <RankingCard />
                <StatsCard />
                <PollCard />
            </main>
            <footer className="tab-bar">
                <p>© 2026 JF News</p>
                {/* Additional footer links or info */}
            </footer>
        </div>
    );
};

export default App;