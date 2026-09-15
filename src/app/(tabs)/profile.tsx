import { router, type Href } from 'expo-router';
import { useCallback } from 'react';

import { ProfileScreen } from '@/components/profile/profile-screen';

export default function ProfileTabScreen() {
  const handleLogin = useCallback(() => {
    router.push('/auth' as Href);
  }, []);

  return <ProfileScreen onLogin={handleLogin} />;
}
