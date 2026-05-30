declare module 'next/link' {
  import React from 'react';
  
  export interface LinkProps {
    href: string;
    children?: React.ReactNode;
    [key: string]: any;
  }
  
  const Link: React.FC<LinkProps>;
  export default Link;
}

declare module 'next/navigation' {
  export function useRouter(): any;
  export function useParams(): any;
  export function usePathname(): any;
  export function useSearchParams(): any;
  export function redirect(path: string): never;
}
