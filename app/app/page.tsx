import { redirect } from 'next/navigation';
import { getServerAuthSession } from '@/app/lib/auth';

// Metadata for the route
export const metadata = {
  title: 'Dashboard App',
  description: 'Healthcare Analytics Dashboard Application'
};

/**
 * App route - redirects to main dashboard.
 * This runs on the server so the redirect happens early.
 */
export default async function AppPage() {
  const session = await getServerAuthSession();

  if (!session) {
    redirect('/auth/signin');
  }

  redirect('/');
}
