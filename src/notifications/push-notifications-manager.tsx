import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { resolveNotificationHref } from '@/notifications/push-navigation';
import { pushRegLog } from '@/notifications/push-registration-debug';
import { syncPushTokenRegistration } from '@/notifications/push-registration';

import '@/notifications/push-notifications-setup';

let hasHandledInitialNotificationResponse = false;

function handleNotificationResponse(
  response: Notifications.NotificationResponse,
  navigate: (href: ReturnType<typeof resolveNotificationHref>) => void,
): void {
  const data = response.notification.request.content.data;
  const href = resolveNotificationHref(data);

  if (href) {
    navigate(href);
  }
}

export function PushNotificationsManager() {
  const router = useRouter();
  const { token, isAuthenticated, isLoading } = useAuth();
  const accessToken = token?.trim() ?? '';

  const navigateFromNotification = useRef((href: ReturnType<typeof resolveNotificationHref>) => {
    if (!href) {
      return;
    }

    router.push(href);
  });

  useEffect(() => {
    navigateFromNotification.current = (href) => {
      if (!href) {
        return;
      }

      router.push(href);
    };
  }, [router]);

  useEffect(() => {
    const guards = {
      platform: Platform.OS,
      isAndroid: Platform.OS === 'android',
      isLoading,
      isAuthenticated,
      hasAccessToken: Boolean(accessToken),
    };

    pushRegLog('PushNotificationsManager: registration effect evaluated', guards);

    if (Platform.OS !== 'android') {
      pushRegLog('PushNotificationsManager: registration skipped (guard: not android)', guards);
      return;
    }

    if (isLoading) {
      pushRegLog('PushNotificationsManager: registration skipped (guard: auth loading)', guards);
      return;
    }

    if (!isAuthenticated) {
      pushRegLog('PushNotificationsManager: registration skipped (guard: not authenticated)', guards);
      return;
    }

    if (!accessToken) {
      pushRegLog('PushNotificationsManager: registration skipped (guard: missing access token)', guards);
      return;
    }

    pushRegLog('PushNotificationsManager: registration effect running syncPushTokenRegistration');
    void syncPushTokenRegistration(accessToken);
  }, [accessToken, isAuthenticated, isLoading]);

  useEffect(() => {
    if (Platform.OS !== 'android' || !isAuthenticated || !accessToken) {
      return;
    }

    const pushTokenSubscription = Notifications.addPushTokenListener((pushToken) => {
      const nextToken = pushToken.data?.trim();

      if (!nextToken) {
        return;
      }

      void syncPushTokenRegistration(accessToken, nextToken);
    });

    return () => {
      pushTokenSubscription.remove();
    };
  }, [accessToken, isAuthenticated]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const receivedSubscription = Notifications.addNotificationReceivedListener(() => {
      // Foreground delivery only; screens refetch authoritative state when focused.
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        handleNotificationResponse(response, navigateFromNotification.current);
      },
    );

    if (!hasHandledInitialNotificationResponse) {
      hasHandledInitialNotificationResponse = true;

      void Notifications.getLastNotificationResponseAsync().then((response) => {
        if (!response) {
          return;
        }

        handleNotificationResponse(response, navigateFromNotification.current);
      });
    }

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return null;
}
