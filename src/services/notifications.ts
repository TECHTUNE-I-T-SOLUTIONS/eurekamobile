import { Platform } from 'react-native';

let Notifications: typeof import('expo-notifications') | null = null;
let Application: typeof import('expo-application') | null = null;

try {
  Notifications = require('expo-notifications');
} catch (e) {
  // Silent fallback when native module is unavailable
}

try {
  Application = require('expo-application');
} catch (e) {
  // Silent fallback when native module is unavailable
}

try {
  if (Notifications?.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch (e) {
  // Silent fallback
}

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  if (!Notifications) {
    return undefined;
  }

  let token: string | undefined;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
      });
    }

    if (Platform.OS !== 'web') {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return undefined;
      }

      try {
        token = (await Notifications.getExpoPushTokenAsync()).data;
      } catch (e) {
        // Silent token catch
      }
    }
  } catch (e) {
    // Silent catch
  }

  return token;
}

export function getApplicationId(): string | null {
  try {
    if (Application?.applicationId) {
      return Application.applicationId;
    }
  } catch (e) {
    // Silent catch
  }
  return null;
}
