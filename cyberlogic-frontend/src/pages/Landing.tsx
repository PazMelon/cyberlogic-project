import { useState, useEffect } from "react";
import {
  HeroSection,
  AnnouncementsPreview,
  BlogPreview,
  UpcomingEvents,
  ResourcesHighlight,
  AboutPreview,
  CTABanner,
} from "../components/landing";

export default function Landing() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <HeroSection />
      <AnnouncementsPreview isLoading={isLoading} />
      <BlogPreview isLoading={isLoading} />
      <UpcomingEvents isLoading={isLoading} />
      <ResourcesHighlight isLoading={isLoading} />
      <AboutPreview isLoading={isLoading} />
      <CTABanner />
    </>
  );
}
