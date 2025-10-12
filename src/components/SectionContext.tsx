import React, { createContext, useContext, useRef } from "react";

type Section = {
  id: string;
  ref: React.RefObject<HTMLElement>;
};

const SectionContext = createContext<{
  sections: Section[];
  register: (id: string, ref: React.RefObject<HTMLElement>) => void;
}>({
  sections: [],
  register: () => {},
});

export const SectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sectionsRef = useRef<Section[]>([]);

  const register = (id: string, ref: React.RefObject<HTMLElement>) => {
    const exists = sectionsRef.current.find((s) => s.id === id);
    if (!exists) sectionsRef.current.push({ id, ref });
  };

  return (
    <SectionContext.Provider value={{ sections: sectionsRef.current, register }}>
      {children}
    </SectionContext.Provider>
  );
};

export const useSections = () => useContext(SectionContext);
