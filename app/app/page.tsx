import { redirect } from 'next/navigation';

// Metadata for the route
export const metadata = {
  title: 'Dashboard App',
  description: 'Healthcare Analytics Dashboard Application'
};

/**
 * App route - redirects to main dashboard.
 * This runs on the server so the redirect happens early.
 */
export default function AppPage() {
  redirect('/');
}
