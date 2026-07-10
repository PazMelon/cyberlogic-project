import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  type?: string;
  url?: string;
}

export function useSEO({ title, description, keywords, image, type = "website", url }: SEOProps) {
  useEffect(() => {
    // 1. Update Title
    const baseTitle = "Cyberlogic Club Portal";
    const fullTitle = title ? `${title} | ${baseTitle}` : baseTitle;
    document.title = fullTitle;

    // Helper to set or create meta tag
    const setMetaTag = (attrName: string, attrValue: string, contentValue: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute("content", contentValue);
    };

    // 2. Update Description
    const defaultDesc = "Cyberlogic Club Portal — The premier student cybersecurity and technology club. Learn, compete, collaborate, and grow.";
    const activeDesc = description || defaultDesc;
    setMetaTag("name", "description", activeDesc);

    // 3. Update Keywords
    if (keywords && keywords.length > 0) {
      setMetaTag("name", "keywords", keywords.join(", "));
    } else {
      const defaultKeywords = "cybersecurity, coding, programming, student club, tech portal, tutorials, bootcamps";
      setMetaTag("name", "keywords", defaultKeywords);
    }

    // 4. Update Open Graph Tags
    setMetaTag("property", "og:title", fullTitle);
    setMetaTag("property", "og:description", activeDesc);
    setMetaTag("property", "og:type", type);
    if (image) {
      setMetaTag("property", "og:image", image);
    }
    if (url) {
      setMetaTag("property", "og:url", url);
    } else {
      setMetaTag("property", "og:url", window.location.href);
    }

    // 5. Update Twitter Tags
    setMetaTag("name", "twitter:title", fullTitle);
    setMetaTag("name", "twitter:description", activeDesc);
    if (image) {
      setMetaTag("name", "twitter:image", image);
    }
  }, [title, description, keywords, image, type, url]);
}
