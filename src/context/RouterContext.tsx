import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface RouterContextType {
  currentPath: string;
  navigate: (path: string) => void;
  scrollToSection: (sectionId: string) => void;
}

const RouterContext = createContext<RouterContextType>({
  currentPath: '/',
  navigate: () => {},
  scrollToSection: () => {},
});

export const normalizePath = (path: string): string => {
  if (!path) return '/';
  const withoutHash = path.split('#')[0];
  const withoutQuery = withoutHash.split('?')[0];
  return withoutQuery || '/';
};

export const RouterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return normalizePath(window.location.pathname || '/');
    }
    return '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      const cleanPath = normalizePath(window.location.pathname || '/');
      setCurrentPath(cleanPath);

      if (window.location.hash) {
        const id = window.location.hash.replace('#', '');
        setTimeout(() => {
          const el = document.getElementById(id);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 50);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const scrollToSection = (sectionId: string) => {
    if (sectionId === 'home') {
      if (currentPath !== '/') {
        window.history.pushState({}, '', '/');
        setCurrentPath('/');
      } else {
        window.history.replaceState(null, '', '/');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (currentPath !== '/') {
      window.history.pushState({}, '', `/#${sectionId}`);
      setCurrentPath('/');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.history.replaceState(null, '', `#${sectionId}`);
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const navigate = (path: string) => {
    // Check if the path targets a landing page section
    const [pathPart, hashPart] = path.split('#');
    const cleanPath = normalizePath(pathPart || '/');

    if (hashPart) {
      if (currentPath === cleanPath) {
        scrollToSection(hashPart);
        return;
      }
      window.history.pushState({}, '', path);
      setCurrentPath(cleanPath);
      setTimeout(() => {
        const el = document.getElementById(hashPart);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return;
    }

    if (path === currentPath) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    window.history.pushState({}, '', path);
    setCurrentPath(cleanPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <RouterContext.Provider value={{ currentPath, navigate, scrollToSection }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => useContext(RouterContext);

export const Link: React.FC<{
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}> = ({ href, className = '', children, onClick }) => {
  const { navigate, scrollToSection } = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (onClick) onClick();

    if (href.startsWith('#')) {
      const sectionId = href.substring(1);
      scrollToSection(sectionId);
      return;
    }

    if (href.startsWith('/#')) {
      const sectionId = href.substring(2);
      scrollToSection(sectionId);
      return;
    }

    navigate(href);
  };

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
};

