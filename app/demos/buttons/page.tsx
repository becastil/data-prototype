"use client";

import React from "react";
import { Button } from "@components/ui/button";

export default function ButtonsDemoPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold font-heading text-black">Buttons Demo</h1>
          <p className="text-gray-600 mt-2">Soft gray button implementation inspired by docs/ideas/button.jpg.</p>
        </header>

        <section className="panel-elevated p-6 space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="soft">Soft Gray</Button>
            <Button variant="soft" size="sm">Soft Gray (sm)</Button>
            <Button variant="soft" size="lg">Soft Gray (lg)</Button>
            <Button variant="soft" disabled>
              Soft Gray (disabled)
            </Button>
            <Button variant="soft" loading>
              Loading
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}

