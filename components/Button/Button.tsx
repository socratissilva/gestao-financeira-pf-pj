"use client";

import Link from "next/link";
import styles from "./Button.module.css";

interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: "primary" | "secondary" | "details";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  
}

export default function Button({
  children,
  href,
  onClick,
  variant = "primary",
  
}: ButtonProps) {
  const className = `
    ${styles.button}
    ${styles[variant]}
    
  `;

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button className={className} onClick={onClick}>
      {children}
    </button>
  );
}