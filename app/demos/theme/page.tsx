"use client";

import React from "react";
import { Button } from "@components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@components/ui/card";
import { Input } from "@components/ui/input";

export default function ThemeDemoPage() {
  return (
    <main className="min-h-screen p-6" style={{ background: '#FFFFFF', color: '#00263E' }}>
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="border-b" style={{ borderColor: '#A4CBE1' }}>
          <h1 className="text-3xl font-bold font-heading" style={{ color: '#00263E' }}>Gallagher Theme Preview</h1>
          <p className="text-sm mb-4" style={{ color: '#00263E' }}>White-dominant UI with primary blue accents and accessible focus</p>
        </header>

        {/* Buttons */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Buttons</h2>
          <div className="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button className="btn-primary">Primary (util)</Button>
            <Button variant="outline">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        {/* Card */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Card</h2>
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Panel Title</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Cards use white background, soft border (#E6EEF5), and subtle shadow.</p>
            </CardContent>
            <CardFooter>
              <span className="chip">Badge/Chip</span>
            </CardFooter>
          </Card>
        </section>

        {/* Inputs */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Inputs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Default input" />
            <Input placeholder="Disabled" disabled />
            <Input placeholder="Focus to see ring" />
          </div>
        </section>
      </div>
    </main>
  );
}

