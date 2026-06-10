"use client";

import dynamic from 'next/dynamic';

const AgentPortal = dynamic(() => import('../AgentPortal'), {
  ssr: false,
});

export default function Page() {
  return <AgentPortal />;
}
