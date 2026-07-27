import { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { Brand, Colors, Fonts, Radii, type Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { galleryApi } from '@/lib/api';
import type { GalleryCategory, GalleryItem } from '@/lib/types';
import { EmptyState, LoadingState, ScreenHeader, Surface } from '@/components/mobile-ui';

export default function GalleryScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

  const load = useCallback(async (categoryId: string) => {
    try {
      const res = await galleryApi.list(categoryId ? { categoryId } : undefined);
      setItems(res.data.data ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load('');
    galleryApi
      .categories()
      .then((res) => setCategories(res.data.data ?? []))
      .catch(() => setCategories([]));
  }, [load]);

  const onSelectCategory = (categoryId: string) => {
    if (categoryId === activeCategoryId) return;
    setActiveCategoryId(categoryId);
    load(categoryId);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load(activeCategoryId);
    setRefreshing(false);
  };

  if (loading) return <LoadingState palette={palette} title="Gallery" />;

  return (
    <>
      <FlatList
        style={{ backgroundColor: palette.background }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        data={items}
        numColumns={3}
        columnWrapperStyle={{ gap: 4 }}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.tint} />}
        ListHeaderComponent={
          <View>
            <ScreenHeader
              palette={palette}
              eyebrow="Community"
              title="Gallery"
              description="Photos from UPOSA events, projects, and reunions."
              icon="images-outline"
            />
            {categories.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 14 }}>
                <CategoryChip
                  palette={palette}
                  label="All"
                  count={items.length}
                  active={activeCategoryId === ''}
                  onPress={() => onSelectCategory('')}
                />
                {categories.map((cat) => (
                  <CategoryChip
                    key={cat.id}
                    palette={palette}
                    label={cat.name}
                    count={cat.imageCount}
                    active={activeCategoryId === cat.id}
                    onPress={() => onSelectCategory(cat.id)}
                  />
                ))}
              </ScrollView>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState palette={palette} icon="images-outline" title="No photos yet" description="Moments from our community will appear here." />
        }
        ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
        renderItem={({ item }) => (
          <Pressable onPress={() => setLightbox(item)} style={({ pressed }) => ({ flex: 1 / 3, opacity: pressed ? 0.78 : 1 })}>
            <Image source={{ uri: item.imageUrl }} style={{ aspectRatio: 1, backgroundColor: palette.surfaceMuted }} contentFit="cover" transition={180} />
          </Pressable>
        )}
      />

      <Modal visible={!!lightbox} animationType="fade" onRequestClose={() => setLightbox(null)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <Pressable onPress={() => setLightbox(null)} style={{ flex: 1, justifyContent: 'center' }}>
            {lightbox ? (
              <Image source={{ uri: lightbox.imageUrl }} style={{ width: '100%', height: '72%' }} contentFit="contain" transition={180} />
            ) : null}
          </Pressable>
          {lightbox && (lightbox.title || lightbox.caption) ? (
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, paddingBottom: 34, backgroundColor: 'rgba(0,0,0,0.55)', gap: 4 }}>
              {lightbox.title ? (
                <Text style={{ color: Brand.cream, fontSize: 17, fontFamily: Fonts.bodyBold }}>{lightbox.title}</Text>
              ) : null}
              {lightbox.caption ? (
                <Text style={{ color: 'rgba(255,248,220,0.78)', fontSize: 13, fontFamily: Fonts.body, lineHeight: 19 }}>{lightbox.caption}</Text>
              ) : null}
            </View>
          ) : null}
          <Pressable
            onPress={() => setLightbox(null)}
            hitSlop={10}
            style={{
              position: 'absolute',
              top: 52,
              right: 18,
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: Brand.gold,
              ...Radii.tile,
            }}
          >
            <Ionicons name="close" size={22} color={Brand.navy} />
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

function CategoryChip({
  palette,
  label,
  count,
  active,
  onPress,
}: {
  palette: Palette;
  label: string;
  count?: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}>
      <Surface
        palette={palette}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: active ? Brand.gold : palette.surface,
          borderColor: active ? Brand.gold : palette.border,
        }}
      >
        <Text
          style={{
            color: active ? Brand.navy : palette.textMuted,
            fontSize: 11,
            fontFamily: Fonts.statusBold,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
        {typeof count === 'number' ? (
          <Text style={{ color: active ? Brand.navy : palette.textMuted, fontSize: 11, fontFamily: Fonts.bodySemiBold }}>{count}</Text>
        ) : null}
      </Surface>
    </Pressable>
  );
}
