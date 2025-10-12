import React, { useEffect, useRef } from "react";
import { useSections } from "./SectionContext";

type Props = {
  id: string;
  children: React.ReactNode;
};

export const VirtualSection: React.FC<Props> = ({ id, children }) => {
  const ref = useRef<HTMLElement>(null);
  const { register } = useSections();

  useEffect(() => {
    register(id, ref);
  }, [id, register]);

  return (
    <section id={id} ref={ref} className="min-h-screen scroll-mt-20">
      {children}
    </section>
  );
};
