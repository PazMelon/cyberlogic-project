import { useEffect } from "react";
import { useLocation } from "react-router";

export function useScrollReveal() {
  const location = useLocation();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            // Stop observing once it has been revealed to keep it visible
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.05, // Lower threshold to make triggering more responsive
        rootMargin: "0px 0px -20px 0px", // Trigger closer to viewport edge
      }
    );

    const observeElements = () => {
      // Use requestAnimationFrame to ensure the DOM has been fully laid out/painted
      requestAnimationFrame(() => {
        const elements = document.querySelectorAll(".reveal-element");
        elements.forEach((el) => {
          if (!el.classList.contains("revealed")) {
            observer.observe(el);
          }
        });
      });
    };

    // Initial check
    observeElements();

    // Set up a MutationObserver to watch for elements added dynamically later (after loading states resolve)
    const mutationObserver = new MutationObserver(() => {
      observeElements();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [location.pathname]); // Re-run when path changes to observe elements on the new page
}
