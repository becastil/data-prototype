'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LiquidNavigationProps {
  items: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
  }>;
  activeItem: string;
  onItemClick: (id: string) => void;
}

const LiquidNavigation: React.FC<LiquidNavigationProps> = ({
  items,
  activeItem,
  onItemClick,
}) => {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  useEffect(() => {
    const activeElement = itemRefs.current[activeItem];
    if (activeElement && navRef.current) {
      const navRect = navRef.current.getBoundingClientRect();
      const itemRect = activeElement.getBoundingClientRect();
      setIndicatorStyle({
        left: itemRect.left - navRect.left,
        width: itemRect.width,
      });
    }
  }, [activeItem]);

  return (
    <div className="relative inline-flex p-1 bg-gray-100 dark:bg-gray-800 rounded-full">
      <div ref={navRef} className="relative flex gap-1">
        {/* Liquid Indicator */}
        <motion.div
          className="absolute h-full bg-gradient-to-r from-[var(--primary-blue)] to-[var(--keenan-tango)] rounded-full"
          initial={false}
          animate={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 35,
          }}
          style={{
            filter: 'blur(0px)',
            boxShadow: '0 0 20px rgba(0, 32, 92, 0.3)',
          }}
        >
          {/* Liquid blob effects */}
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <motion.div
              className="absolute w-[120%] h-[120%] bg-gradient-to-r from-[var(--primary-blue)] to-[var(--ap-blue)] rounded-full opacity-60"
              animate={{
                x: ['-10%', '10%', '-10%'],
                y: ['-5%', '5%', '-5%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                filter: 'blur(8px)',
              }}
            />
            <motion.div
              className="absolute w-[110%] h-[110%] bg-gradient-to-r from-[var(--keenan-tango)] to-[var(--gallagher-orange)] rounded-full opacity-40"
              animate={{
                x: ['10%', '-10%', '10%'],
                y: ['5%', '-5%', '5%'],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                filter: 'blur(10px)',
              }}
            />
          </div>
        </motion.div>

        {/* Navigation Items */}
        {items.map((item) => (
          <button
            key={item.id}
            ref={(el) => (itemRefs.current[item.id] = el)}
            onClick={() => onItemClick(item.id)}
            className={`
              relative z-10 flex items-center gap-2 px-4 py-2 rounded-full
              transition-all duration-300 font-medium text-sm
              ${
                activeItem === item.id
                  ? 'text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }
            `}
          >
            {item.icon && <span className="w-4 h-4">{item.icon}</span>}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LiquidNavigation;