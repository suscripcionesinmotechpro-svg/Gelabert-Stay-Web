"use client";

import dynamic from 'next/dynamic';

const AdminPortal = dynamic(() => import('../AdminPortal'), {
  ssr: false,
});

export default function Page() {
  return <AdminPortal />;
}
