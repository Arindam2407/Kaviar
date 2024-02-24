"use client";

import Interface from "@/components/Interface";
import { MoralisProvider } from 'react-moralis'

export default function Home() {
  return (
    <MoralisProvider initializeOnMount={false}>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <link rel="stylesheet" href="./css/bootstrap.min.css"></link>
        <Interface/>
        </div>
      </main>
    </MoralisProvider>
  );
}