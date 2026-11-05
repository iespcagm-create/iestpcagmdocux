interface BrandProps {
  variant?: 'hero' | 'sidebar';
}

export function Brand({ variant = 'sidebar' }: BrandProps) {
  const logoSrc = `${import.meta.env.BASE_URL}branding/docux-logo.jpg`;

  return (
    <img
      alt="DOCUX. Digitaliza. Gestiona. Avanza."
      className={`brand brand--${variant}`}
      src={logoSrc}
    />
  );
}
