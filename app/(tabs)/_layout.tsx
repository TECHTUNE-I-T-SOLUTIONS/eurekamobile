import React from 'react';
import { Tabs } from 'expo-router';
import { View, TouchableOpacity, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/context/ThemeContext';
import {
  LayoutDashboard,
  BookOpen,
  MessageSquareCode,
  Headphones,
  User,
} from 'lucide-react-native';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const currentDescriptor = descriptors[state.routes[state.index]?.key];
  const tabBarStyle = currentDescriptor?.options?.tabBarStyle as any;
  if (tabBarStyle?.display === 'none') {
    return null;
  }

  // Calculate bottom offset: On devices with hardware/software system navigation bars
  // (or home indicator), insets.bottom gives the exact system bar height.
  // We add a comfortable margin (8px on Android, 4px on iOS) so the floating bar sits above the system buttons.
  const bottomOffset = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 6);

  return (
    <View
      style={{
        position: 'absolute',
        bottom: bottomOffset,
        left: 0,
        right: 0,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'box-none',
        zIndex: 1000,
      }}
    >
      <View
        style={{
          width: 240,
          maxWidth: '92%',
          height: 54,
          borderRadius: 27,
          alignSelf: 'center',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 8,
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.92)',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
          elevation: 14,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.35 : 0.1,
          shadowRadius: 14,
        }}
      >
        {state.routes.map((route: any, index: number) => {
          const { options, navigation: routeNavigation } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = routeNavigation.emit?.({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event?.defaultPrevented) {
              routeNavigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            routeNavigation.emit?.({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const color = isFocused
            ? isDark ? '#38BDF8' : '#2563EB'
            : isDark ? '#94A3B8' : '#64748B';

          let icon = null;
          if (route.name === 'index') {
            icon = <LayoutDashboard size={18} color={color} />;
          } else if (route.name === 'notes') {
            icon = <BookOpen size={18} color={color} />;
          } else if (route.name === 'chat') {
            icon = <MessageSquareCode size={18} color={color} />;
          } else if (route.name === 'lecturer') {
            icon = <Headphones size={18} color={color} />;
          } else if (route.name === 'profile') {
            icon = <User size={18} color={color} />;
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={{
                flex: isFocused ? 2 : 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 4,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isFocused
                    ? isDark
                      ? 'rgba(56, 189, 248, 0.18)'
                      : 'rgba(37, 99, 235, 0.1)'
                    : 'transparent',
                  paddingHorizontal: isFocused ? 10 : 0,
                  paddingVertical: 6,
                  borderRadius: 18,
                }}
              >
                {icon}
                {isFocused && (
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '600',
                      marginLeft: 4,
                      color,
                    }}
                    numberOfLines={1}
                  >
                    {typeof label === 'string' ? label : route.name}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { isDark } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? '#38BDF8' : '#2563EB',
        tabBarInactiveTintColor: isDark ? '#94A3B8' : '#64748B',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <LayoutDashboard size={18} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
          tabBarIcon: ({ color }) => <BookOpen size={18} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'AI Chat',
          tabBarIcon: ({ color }) => <MessageSquareCode size={18} color={color} />,
        }}
      />
      <Tabs.Screen
        name="lecturer"
        options={{
          title: 'Lecturer',
          tabBarIcon: ({ color }) => <Headphones size={18} color={color} />,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={18} color={color} />,
        }}
      />
    </Tabs>
  );
}
