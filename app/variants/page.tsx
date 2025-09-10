"use client";

import React from "react";
import AnimatedVariantsMenu from "@components/navigation/AnimatedVariantsMenu";

const VariantsDemoPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold font-heading text-black">Animated Variants Menu</h1>
          <p className="text-gray-600 mt-2">Framer Motion variants demo integrated into the codebase.</p>
        </header>
        <div className="panel-elevated p-6">
          <AnimatedVariantsMenu />
        </div>
      </div>
    </main>
  );
};

export default VariantsDemoPage;

