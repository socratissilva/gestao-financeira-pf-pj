// components/AddButton.tsx
import Button from "@/components/Button/Button";

interface AddButtonProps {
  href: string;
  label?: string;
  children?: React.ReactNode;
}

export default function AddButton({
  href,
  label = "Novo",
  children,
}: AddButtonProps) {
  return (
    <Button href={href}>
      {children ? (
        children
      ) : (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold' }}>+</span>
          <span>{label}</span> {/* Removemos a palavra "Novo" fixa daqui */}
        </div>
      )}
    </Button>
  );
}