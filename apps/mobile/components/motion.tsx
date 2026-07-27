import { useEffect, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export const Motion = {
  easeOut: Easing.bezier(0.23, 1, 0.32, 1),
  easeInOut: Easing.bezier(0.77, 0, 0.175, 1),
  duration: { press: 120, entrance: 260, exit: 180, stagger: 40 },
} as const;

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduced(enabled);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return reduced;
}

type FadeInUpProps = {
  children: ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
};

export function FadeInUp({ children, delay = 0, distance = 12, style }: FadeInUpProps) {
  const reduced = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(reduced ? 1 : 0));
  const [translateY] = useState(() => new Animated.Value(reduced ? 0 : distance));

  useEffect(() => {
    if (reduced) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: Motion.duration.entrance,
        delay,
        easing: Motion.easeOut,
        useNativeDriver: false,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: Motion.duration.entrance,
        delay,
        easing: Motion.easeOut,
        useNativeDriver: false,
      }),
    ]).start();
  }, [opacity, translateY, delay, reduced]);

  if (reduced) {
    return <Animated.View style={style}>{children}</Animated.View>;
  }

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

type PressableScaleProps = {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  scale?: number;
  hitSlop?: number;
  fade?: boolean;
};

export function PressableScale({
  children,
  onPress,
  style,
  disabled,
  scale = 0.97,
  hitSlop,
  fade = true,
}: PressableScaleProps) {
  const reduced = useReducedMotion();
  const [scaleValue] = useState(() => new Animated.Value(1));

  const animateTo = (toValue: number) => {
    Animated.timing(scaleValue, {
      toValue,
      duration: Motion.duration.press,
      easing: Motion.easeOut,
      useNativeDriver: false,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      onPressIn={reduced ? undefined : () => animateTo(scale)}
      onPressOut={reduced ? undefined : () => animateTo(1)}
      style={({ pressed }) => [
        style as ViewStyle,
        fade && pressed && !disabled ? { opacity: 0.82 } : null,
      ]}
    >
      {reduced ? (
        children
      ) : (
        <Animated.View style={{ transform: [{ scale: scaleValue }] }}>{children}</Animated.View>
      )}
    </Pressable>
  );
}
