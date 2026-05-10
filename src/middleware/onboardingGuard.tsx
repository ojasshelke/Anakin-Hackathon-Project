'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/hooks/useUser';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      if (pathname === '/products' || pathname === '/onboarding') {
        router.replace('/auth/signup');
      } else {
        setIsReady(true);
      }
      return;
    }

    const hasAvatar = !!user.avatar_url;

    if (!hasAvatar && pathname === '/products') {
      router.replace('/onboarding');
    } else if (hasAvatar && pathname === '/onboarding') {
      router.replace('/products');
    } else {
      setIsReady(true);
    }
    setHasMounted(true);
  }, [user, isLoading, pathname, router]);

  // Only show the global loading spinner on the initial mount or when actually loading a logged-out state
  if ((!isReady && isLoading) || (!hasMounted && isLoading)) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-black absolute inset-0 z-[100]">
        <div className="w-8 h-8 border-2 border-[#bef264]/20 border-t-[#bef264] rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
