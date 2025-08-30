'use client';

import React from 'react';
import { motion } from 'framer-motion';
import AccessibleIcon from './AccessibleIcon';
import {
  Home,
  Settings,
  User,
  Bell,
  Heart,
  Star,
  Search,
  Menu,
  X,
  Download,
  Upload,
  Save,
  Trash2,
  Edit,
  Plus,
  Minus,
  ChevronRight,
  RefreshCw,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Calendar,
  Clock,
  MapPin,
  Bookmark,
  Share2,
  Filter,
  BarChart2,
  PieChart,
  TrendingUp,
  DollarSign,
  CreditCard,
  ShoppingCart,
  Package,
  Truck,
  Globe,
  Wifi,
  Cloud,
  Database,
  Server,
  Lock,
  Unlock,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';

const IconShowcase: React.FC = () => {
  const iconSizes: Array<'xs' | 'sm' | 'md' | 'lg' | 'xl'> = ['xs', 'sm', 'md', 'lg', 'xl'];
  const variants: Array<'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'> = 
    ['default', 'primary', 'success', 'warning', 'danger', 'info'];

  const commonIcons = [
    { icon: <Home />, label: 'Home' },
    { icon: <Settings />, label: 'Settings' },
    { icon: <User />, label: 'Profile' },
    { icon: <Bell />, label: 'Notifications' },
    { icon: <Search />, label: 'Search' },
    { icon: <Save />, label: 'Save' },
  ];

  const statusIcons = [
    { icon: <CheckCircle />, label: 'Success', variant: 'success' as const },
    { icon: <AlertTriangle />, label: 'Warning', variant: 'warning' as const },
    { icon: <XCircle />, label: 'Error', variant: 'danger' as const },
    { icon: <Info />, label: 'Information', variant: 'info' as const },
  ];

  const animatedIcons = [
    { icon: <RefreshCw />, label: 'Refresh', className: 'icon-spin' },
    { icon: <Heart />, label: 'Favorite', className: 'icon-pulse' },
    { icon: <Bell />, label: 'Alert', className: 'icon-bounce' },
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Size Demonstration */}
      <section className="panel-elevated p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4 font-heading">Icon Sizes (WCAG Compliant Touch Targets)</h3>
        <div className="flex items-center gap-4 flex-wrap">
          {iconSizes.map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <AccessibleIcon
                icon={<Settings />}
                label={`Settings (${size})`}
                size={size}
                variant="primary"
                onClick={() => console.log(`Clicked ${size} icon`)}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">{size.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Variant Demonstration */}
      <section className="panel-elevated p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4 font-heading">Icon Variants (High Contrast)</h3>
        <div className="flex items-center gap-4 flex-wrap">
          {variants.map((variant) => (
            <div key={variant} className="flex flex-col items-center gap-2">
              <AccessibleIcon
                icon={<Star />}
                label={`${variant} star`}
                size="md"
                variant={variant}
                onClick={() => console.log(`Clicked ${variant} icon`)}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">{variant}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Status Icons with Context */}
      <section className="panel-elevated p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4 font-heading">Contextual Status Icons</h3>
        <div className="flex items-center gap-6 flex-wrap">
          {statusIcons.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <AccessibleIcon
                icon={item.icon}
                label={item.label}
                size="md"
                variant={item.variant}
                showTooltip={true}
              />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Animated Icons */}
      <section className="panel-elevated p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4 font-heading">Animated Icons</h3>
        <div className="flex items-center gap-6 flex-wrap">
          {animatedIcons.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2">
              <div className={item.className}>
                <AccessibleIcon
                  icon={item.icon}
                  label={item.label}
                  size="lg"
                  variant="primary"
                  animate={false}
                />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Icons Grid */}
      <section className="panel-elevated p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4 font-heading">Interactive Icon Grid</h3>
        <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
          {commonIcons.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <AccessibleIcon
                icon={item.icon}
                label={item.label}
                size="md"
                variant="default"
                onClick={() => console.log(`Clicked ${item.label}`)}
                showTooltip={true}
                tooltipPosition="top"
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Accessibility Features */}
      <section className="panel-elevated p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4 font-heading">Accessibility Features</h3>
        <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex items-start gap-2">
            <AccessibleIcon icon={<CheckCircle />} label="Check" size="xs" variant="success" showTooltip={false} />
            <span>All icons meet WCAG AA standards with minimum 4.5:1 contrast ratio</span>
          </div>
          <div className="flex items-start gap-2">
            <AccessibleIcon icon={<CheckCircle />} label="Check" size="xs" variant="success" showTooltip={false} />
            <span>Touch targets are minimum 44x44px for mobile accessibility</span>
          </div>
          <div className="flex items-start gap-2">
            <AccessibleIcon icon={<CheckCircle />} label="Check" size="xs" variant="success" showTooltip={false} />
            <span>Full keyboard navigation support with visible focus indicators</span>
          </div>
          <div className="flex items-start gap-2">
            <AccessibleIcon icon={<CheckCircle />} label="Check" size="xs" variant="success" showTooltip={false} />
            <span>Semantic ARIA labels and tooltips for screen readers</span>
          </div>
          <div className="flex items-start gap-2">
            <AccessibleIcon icon={<CheckCircle />} label="Check" size="xs" variant="success" showTooltip={false} />
            <span>High contrast mode support with enhanced visibility</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default IconShowcase;