export function Logo({ alt, className }: { alt: string; className?: string }) {
  return <img src="/logo.webp" alt={alt} width={290} height={240} className={`logo ${className ?? ''}`} />;
}
