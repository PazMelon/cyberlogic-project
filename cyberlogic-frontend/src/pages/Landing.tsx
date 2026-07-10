import { useState, useEffect } from "react";
import { useSEO } from "../utils/useSEO";
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
  useSEO({
    title: "Home",
    description: "Welcome to Cyberlogic Club Portal — The premier student cybersecurity and technology club. Learn, compete, collaborate, and grow.",
    keywords: ["cybersecurity", "programming", "coding", "bootcamps", "IT education", "student club"],
  });

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
