import { Alert, Platform } from 'react-native';

type ConfirmOptions = {
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  destructive?: boolean;
};

export function confirmAsync(options: ConfirmOptions): Promise<boolean> {
  const cancelText = options.cancelText ?? 'Cancel';

  if (Platform.OS === 'web') {
    if (typeof globalThis.confirm === 'function') {
      return Promise.resolve(
        globalThis.confirm(`${options.title}\n\n${options.message}`),
      );
    }

    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    Alert.alert(options.title, options.message, [
      { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
      {
        text: options.confirmText,
        style: options.destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });
}

export function showUserAlert(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    globalThis.alert(message ? `${title}\n\n${message}` : title);
    return;
  }

  Alert.alert(title, message);
}
