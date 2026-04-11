import { Route, Routes, useLocation } from "react-router";
import { lazy, Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import SplashScreen from "./components/common/SplashScreen.tsx";

const Home = lazy(() => import("./pages/Home.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const Membership = lazy(() => import("./pages/Membership.tsx"));
const News = lazy(() => import("./pages/News.tsx"));
const Events = lazy(() => import("./pages/Events.tsx"));
const Projects = lazy(() => import("./pages/Projects.tsx"));
const Community = lazy(() => import("./pages/Community.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const Donate = lazy(() => import("./pages/Donate.tsx"));
const OurSchool = lazy(() => import("./pages/OurSchool.tsx"));
const NewsDetail = lazy(() => import("./pages/NewsDetail.tsx"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail.tsx"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage.tsx"));

function App() {
    const location = useLocation();

    return (
        <Suspense
            fallback={<SplashScreen />}
        >
            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/our-school" element={<OurSchool />} />
                    <Route path="/membership" element={<Membership />} />
                    <Route path="/news" element={<News />} />
                    <Route path="/news/:slug" element={<NewsDetail />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/projects/:slug" element={<ProjectDetail />} />
                    <Route path="/community" element={<Community />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/donate" element={<Donate />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </AnimatePresence>
        </Suspense>
    );
}

export default App;
