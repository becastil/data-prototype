'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AccessibleIcon from './AccessibleIcon';
import {
  Home,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home /> },
    { id: 'table', label: 'Financial Table', icon: <FileText /> },
    { id: 'charts', label: 'Analytics', icon: <BarChart3 /> },
  ];

  const bottomItems = [
    { id: 'settings', label: 'Settings', icon: <Settings /> },
  ];

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0, width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-full bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white shadow-2xl z-40 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center font-bold text-lg">
                  K
                </div>
                <div>
                  <h2 className="font-semibold text-sm">Keenan Dashboard</h2>
                  <p className="text-xs text-gray-400">CEO Overview</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </div>

      {/* User Profile */}
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="p-4 border-b border-gray-700/50"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
              AS
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Aurelienne Shah</p>
              <p className="text-xs text-gray-400">Controller</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-3">
          {menuItems.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onPageChange(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                transition-all duration-200 group relative
                ${currentPage === item.id 
                  ? 'bg-gradient-to-r from-teal-500/20 to-blue-500/20 text-white border-l-4 border-teal-400' 
                  : 'hover:bg-gray-700/50 text-gray-300 hover:text-white'
                }
              `}
              aria-label={item.label}
            >
              <div className={`${currentPage === item.id ? 'text-teal-400' : 'text-gray-400 group-hover:text-white'}`}>
                {React.cloneElement(item.icon as React.ReactElement, { size: 20 })}
              </div>
              
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 text-left text-sm font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Active indicator */}
              {currentPage === item.id && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute right-0 w-1 h-8 bg-teal-400 rounded-l-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-gray-700/50 p-3 space-y-1">
        {bottomItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-700/50 text-gray-300 hover:text-white transition-all duration-200 group"
            aria-label={item.label}
          >
            <div className="text-gray-400 group-hover:text-white">
              {React.cloneElement(item.icon as React.ReactElement, { size: 20 })}
            </div>
            
            {!isCollapsed && (
              <span className="flex-1 text-left text-sm font-medium">
                {item.label}
              </span>
            )}
          </button>
        ))}

        {/* Logout */}
        <button
          onClick={() => console.log('Logout')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition-all duration-200 group mt-2"
          aria-label="Logout"
        >
          <div className="text-gray-400 group-hover:text-red-400">
            <LogOut size={20} />
          </div>
          {!isCollapsed && (
            <span className="flex-1 text-left text-sm font-medium">
              Logout
            </span>
          )}
        </button>
      </div>

      {/* Collapse Indicator */}
      {isCollapsed && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 bg-teal-400 rounded-full"
          />
        </div>
      )}
    </motion.div>
  );
};

export default Sidebar;
