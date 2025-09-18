'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, BarChart3, TrendingUp } from 'lucide-react';
import { Button } from '@components/ui/button';

/**
 * Charts page - dedicated analytics and visualizations view
 * Currently redirects to main dashboard with report view
 * Future: Could be expanded to full-screen chart interface
 */
export default function ChartsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 p-6"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button asChild variant="soft" size="sm">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-blue-500 rounded-full" />
            <h1 className="text-3xl font-bold text-gray-900">
              Charts & Analytics
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <div className="text-center max-w-md mx-auto">
            <div className="flex justify-center gap-4 mb-6">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Advanced Analytics View
            </h2>
            
            <p className="text-gray-600 mb-6">
              The charts and visualizations are integrated into the main dashboard. 
              Use the "Performance Report" tab to access detailed analytics.
            </p>
            
            <Button asChild className="w-full">
              <Link href="/?view=report">
                View Performance Report
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Data Table View</h3>
            <p className="text-gray-600 text-sm mb-4">
              Browse raw financial data and detailed records
            </p>
            <Button asChild variant="soft" size="sm">
              <Link href="/?view=table">Open Data Table</Link>
            </Button>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Upload New Data</h3>
            <p className="text-gray-600 text-sm mb-4">
              Start fresh with new claims and enrollment data
            </p>
            <Button asChild variant="soft" size="sm">
              <Link href="/?reset=true">Upload Data</Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export const metadata = {
  title: 'Charts & Analytics - Healthcare Dashboard',
  description: 'Advanced analytics and visualization tools for healthcare data'
};