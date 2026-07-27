import { useCallback, useEffect, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Brand, Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { membersApi } from '@/lib/api';
import type { Member } from '@/lib/types';
import {
  AvatarMark,
  DetailRow,
  EmptyState,
  HeroPanel,
  LoadingState,
  Pill,
  ScreenHeader,
  ScreenScroll,
  SectionTitle,
  Surface,
} from '@/components/mobile-ui';

export default function MemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await membersApi.getById(id);
      setMember(res.data.data ?? null);
    } catch {
      setMember(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState palette={palette} title="Member" />;

  if (!member) {
    return (
      <ScreenScroll palette={palette}>
        <EmptyState palette={palette} icon="person-outline" title="Member not found" description="This profile may no longer be visible in the directory." />
      </ScreenScroll>
    );
  }

  return (
    <ScreenScroll palette={palette}>
      <ScreenHeader
        palette={palette}
        eyebrow="Member record"
        title={member.fullName}
        description={[member.occupation, member.organization].filter(Boolean).join(' · ') || 'UPOSA alumnus'}
        right={<AvatarMark palette={palette} name={member.fullName} photoUrl={member.photoUrl} size={62} />}
      />

      <HeroPanel
        palette={palette}
        eyebrow={member.membershipStatus}
        title={member.isAvailableAsMentor ? 'Available for mentorship' : 'Alumni directory profile'}
        body={member.mentorBio || 'Use this record to connect with classmates, old students, and professional contacts.'}
        icon={member.isAvailableAsMentor ? 'hand-left-outline' : 'person-outline'}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {member.yearGroup ? <Pill palette={palette} tone="gold">Class of {member.yearGroup}</Pill> : null}
          {member.house ? <Pill palette={palette} tone="navy">{member.house} House</Pill> : null}
          {member.isAvailableAsMentor ? <Pill palette={palette} tone="gold">Mentor</Pill> : null}
        </View>
      </HeroPanel>

      {member.areaOfExpertise && member.areaOfExpertise.length > 0 ? (
        <>
          <SectionTitle palette={palette} title="Expertise" />
          <Surface palette={palette} style={{ padding: 14 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {member.areaOfExpertise.map((tag) => (
                <Pill key={tag} palette={palette}>{tag}</Pill>
              ))}
            </View>
          </Surface>
        </>
      ) : null}

      <SectionTitle palette={palette} title="Contact" />
      <View style={{ gap: 10 }}>
        <DetailRow palette={palette} icon="mail-outline" label="Email" value={member.email} onPress={() => Linking.openURL(`mailto:${member.email}`)} />
        {member.mobileNumber ? (
          <DetailRow palette={palette} icon="call-outline" label="Phone" value={member.mobileNumber} onPress={() => Linking.openURL(`tel:${member.mobileNumber}`)} />
        ) : null}
        <DetailRow
          palette={palette}
          icon="location-outline"
          label="Location"
          value={[member.city, member.region, member.country].filter(Boolean).join(', ') || 'Not set'}
        />
      </View>

      <SectionTitle palette={palette} title="School details" />
      <Surface palette={palette} style={{ padding: 14, gap: 12 }}>
        <View>
          <Text style={{ color: Brand.gold, fontSize: 11, fontFamily: Fonts.statusBold, letterSpacing: 1.4 }}>PROGRAMME</Text>
          <Text style={{ color: palette.text, fontSize: 16, fontFamily: Fonts.bodyBold, marginTop: 5 }}>{member.programme ?? 'Not set'}</Text>
        </View>
        <View>
          <Text style={{ color: Brand.gold, fontSize: 11, fontFamily: Fonts.statusBold, letterSpacing: 1.4 }}>MEMBERSHIP</Text>
          <Text style={{ color: palette.text, fontSize: 16, fontFamily: Fonts.bodyBold, marginTop: 5 }}>{member.membershipStatus}</Text>
        </View>
      </Surface>
    </ScreenScroll>
  );
}
