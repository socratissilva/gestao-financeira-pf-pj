// "use client";

// import { SessionProvider } from "next-auth/react";

// export default function Providers({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <SessionProvider>
//       {children}
//     </SessionProvider>
//   );
// }

'use client';

// import { SessionProvider } from 'next-auth/react';
// import { ToastProvider } from '@/lib/toast-context';
// import { ToastContainer } from '@/components/ToastContainer';

// export function Providers({ children }: { children: React.ReactNode }) {
//   return (
//     <SessionProvider>
//       <ToastProvider>
//         {children}
//         <ToastContainer />
//       </ToastProvider>
//     </SessionProvider>
//   );
// }


"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}