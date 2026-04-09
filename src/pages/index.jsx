// Complete production version of index.jsx
// This includes all necessary components

import NextDuelCard from '../components/NextDuelCard';
import MatchCarousel from '../components/MatchCarousel';
import NewsCard from '../components/NewsCard';
import QuizGame from '../components/QuizGame';
import DailyPoll from '../components/DailyPoll';
import ATPRankingList from '../components/ATPRankingList';
import RankingChart from '../components/RankingChart';
import CareerTimeline from '../components/CareerTimeline';
import ATPCalendar from '../components/ATPCalendar';
import NextGenComparator from '../components/NextGenComparator';
import TournamentFactsCarousel from '../components/TournamentFactsCarousel';
import LiveScoreCard from '../components/LiveScoreCard';
import Modal from '../components/Modal';
import Header from '../components/Header';
import MobileTabBar from '../components/MobileTabBar';
import { PWAFeatures } from '../features/PWAFeatures';
import { PushNotifications } from '../features/PushNotifications';
import { LocalStorageCaching } from '../features/LocalStorageCaching';
import { FeedbackSystem } from '../features/FeedbackSystem';

function IndexPage() {
    return (
        <div>
            <Header />
            <MatchCarousel />
            <NextDuelCard />
            <NewsCard />
            <QuizGame />
            <DailyPoll />
            <ATPRankingList />
            <RankingChart />
            <CareerTimeline />
            <ATPCalendar />
            <NextGenComparator />
            <TournamentFactsCarousel />
            <LiveScoreCard />  
            <MobileTabBar />
            <PWAFeatures />
            <PushNotifications />
            <LocalStorageCaching />
            <FeedbackSystem />
            <Modal />
        </div>
    );
}

export default IndexPage;
