import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { Brand, Colors, Fonts, type Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { membersApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type { EmploymentType, Gender, House, MaritalStatus, Member, Programme } from '@/lib/types';
import {
  ActionText,
  AvatarMark,
  Field,
  PrimaryButton,
  ScreenHeader,
  ScreenScroll,
  SectionTitle,
  Surface,
} from '@/components/mobile-ui';
import { DateField } from '@/components/date-field';
import { SelectField } from '@/components/select-field';
import { cityOptions, countryOptions, stateOptions } from '@/lib/locations';

const genders: Gender[] = ['MALE', 'FEMALE', 'OTHER'];
const maritalStatuses: MaritalStatus[] = ['SINGLE', 'MARRIED', 'SEPARATED', 'DIVORCED', 'WIDOWED'];
const programmes: Programme[] = ['GENERAL_ARTS', 'BUSINESS', 'HOME_ECONOMICS', 'VISUAL_ARTS', 'SCIENCE'];
const houses: House[] = ['ACKAH', 'DENSU', 'TANO', 'NKRUMAH', 'PRA', 'VOLTA'];
const employmentTypes: EmploymentType[] = ['GOVERNMENT_WORKER', 'PRIVATE_WORKER', 'SELF_EMPLOYED', 'UNEMPLOYED', 'RETIRED', 'STUDENT'];

function formatEnumLabel(value: string) {
  return value
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

function EnumPicker<T extends string>({
  palette,
  label,
  options,
  value,
  onSelect,
}: {
  palette: Palette;
  label: string;
  options: T[];
  value: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.enumField}>
      <Text style={[styles.enumLabel, { color: palette.text }]}>{label}</Text>
      <View style={styles.enumRow}>
        {options.map((option) => {
          const active = value === option;
          return (
            <Pressable
              key={option}
              onPress={() => onSelect(active ? '' : option)}
              style={({ pressed }) => [
                styles.enumPill,
                {
                  backgroundColor: active ? Brand.gold : palette.surfaceMuted,
                  borderColor: active ? Brand.gold : palette.border,
                  opacity: pressed ? 0.78 : 1,
                },
              ]}
            >
              <Text style={[styles.enumPillText, { color: active ? Brand.navy : palette.textMuted }]}>
                {formatEnumLabel(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function EditProfileScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [form, setForm] = useState({
    fullName: user?.fullName ?? '',
    gender: user?.gender ?? '',
    dateOfBirth: user?.dateOfBirth?.split('T')[0] ?? '',
    maritalStatus: user?.maritalStatus ?? '',
    mobileNumber: user?.mobileNumber ?? '',
    altPhoneNumber: user?.altPhoneNumber ?? '',
    residentialAddress: user?.residentialAddress ?? '',
    city: user?.city ?? '',
    region: user?.region ?? '',
    country: user?.country ?? 'Ghana',
    yearGroup: user?.yearGroup?.toString() ?? '',
    programme: user?.programme ?? '',
    house: user?.house ?? '',
    employmentType: user?.employmentType ?? '',
    occupation: user?.occupation ?? '',
    organization: user?.organization ?? '',
    areaOfExpertise: (user?.areaOfExpertise ?? []).join(', '),
    mentorBio: user?.mentorBio ?? '',
    emergencyContactNumber: user?.emergencyContactNumber ?? '',
    emergencyRelationship: user?.emergencyRelationship ?? '',
    nextOfKinName: user?.nextOfKinName ?? '',
    nextOfKinContact: user?.nextOfKinContact ?? '',
    nextOfKinRelationship: user?.nextOfKinRelationship ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (key: keyof typeof form) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSave = async () => {
    if (form.fullName.trim().length < 2) {
      Alert.alert('Check your name', 'Full name must be at least 2 characters.');
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<Member> = { fullName: form.fullName.trim() };
      const textFields = [
        'dateOfBirth',
        'mobileNumber',
        'altPhoneNumber',
        'residentialAddress',
        'city',
        'region',
        'country',
        'occupation',
        'organization',
        'mentorBio',
        'emergencyContactNumber',
        'emergencyRelationship',
        'nextOfKinName',
        'nextOfKinContact',
        'nextOfKinRelationship',
      ] as const;
      for (const key of textFields) {
        const value = form[key].trim();
        if (value) payload[key] = value;
      }
      if (form.gender) payload.gender = form.gender as Gender;
      if (form.maritalStatus) payload.maritalStatus = form.maritalStatus as MaritalStatus;
      if (form.programme) payload.programme = form.programme as Programme;
      if (form.house) payload.house = form.house as House;
      if (form.employmentType) payload.employmentType = form.employmentType as EmploymentType;
      const year = Number(form.yearGroup.trim());
      if (form.yearGroup.trim() && Number.isFinite(year)) payload.yearGroup = year;
      payload.areaOfExpertise = form.areaOfExpertise
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      const res = await membersApi.updateProfile(payload);
      if (res.data.data) updateUser(res.data.data);
      Alert.alert('Profile updated', 'Your alumni record has been saved.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not save your profile.';
      Alert.alert('Save failed', msg);
    } finally {
      setSaving(false);
    }
  };

  const onChangePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', {
        uri: asset.uri,
        name: asset.fileName ?? 'photo.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      } as unknown as Blob);
      const res = await membersApi.uploadPhoto(formData);
      if (res.data.data) updateUser(res.data.data);
      Alert.alert('Photo updated', 'Your profile photo has been saved.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not upload photo. Check that Cloudinary is configured.';
      Alert.alert('Upload failed', msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScreenScroll palette={palette} keyboardShouldPersistTaps="handled">
      <ScreenHeader
        palette={palette}
        eyebrow="Member profile"
        title="Edit profile"
        description="Keep your contact, year-group, and professional details current so the directory stays useful."
        icon="create-outline"
      />

      <Surface palette={palette} style={styles.photoCard}>
        <AvatarMark palette={palette} name={user?.fullName} photoUrl={user?.photoUrl} size={88} />
        <Text style={[styles.photoName, { color: palette.text }]}>{user?.fullName ?? 'UPOSA Member'}</Text>
        <Text style={[styles.photoEmail, { color: palette.textMuted }]}>{user?.email ?? 'Email pending'}</Text>
        <ActionText label={uploading ? 'Uploading…' : 'Change photo'} palette={palette} onPress={() => { if (!uploading) onChangePhoto(); }} />
      </Surface>

      <SectionTitle palette={palette} title="Personal" />
      <Surface palette={palette} style={styles.sectionCard}>
        <Field palette={palette} label="Full name" value={form.fullName} onChangeText={set('fullName')} icon="person-outline" />
        <EnumPicker palette={palette} label="Gender" options={genders} value={form.gender} onSelect={set('gender')} />
        <DateField palette={palette} label="Date of birth" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
        <EnumPicker palette={palette} label="Marital status" options={maritalStatuses} value={form.maritalStatus} onSelect={set('maritalStatus')} />
      </Surface>

      <SectionTitle palette={palette} title="Contact" />
      <Surface palette={palette} style={styles.sectionCard}>
        <Field palette={palette} label="Mobile number" value={form.mobileNumber} onChangeText={set('mobileNumber')} icon="call-outline" keyboardType="phone-pad" />
        <Field palette={palette} label="Alternative phone" value={form.altPhoneNumber} onChangeText={set('altPhoneNumber')} icon="call-outline" keyboardType="phone-pad" />
        <Field palette={palette} label="Residential address" value={form.residentialAddress} onChangeText={set('residentialAddress')} icon="home-outline" />
        <SelectField
          palette={palette}
          label="Country"
          value={form.country}
          options={countryOptions}
          onChange={(country) => {
            set('country')(country);
            set('region')('');
            set('city')('');
          }}
          placeholder="Select country"
        />
        <SelectField
          palette={palette}
          label="Region / State"
          value={form.region}
          options={stateOptions(form.country)}
          onChange={(region) => {
            set('region')(region);
            set('city')('');
          }}
          placeholder={form.country ? 'Select region / state' : 'Select a country first'}
          disabled={!form.country}
        />
        <SelectField
          palette={palette}
          label="City"
          value={form.city}
          options={cityOptions(form.country, form.region)}
          onChange={set('city')}
          placeholder={form.region ? 'Select city' : 'Select a region first'}
          disabled={!form.region}
        />
      </Surface>

      <SectionTitle palette={palette} title="Academic" />
      <Surface palette={palette} style={styles.sectionCard}>
        <Field palette={palette} label="Year group" value={form.yearGroup} onChangeText={set('yearGroup')} placeholder="e.g. 2008" icon="school-outline" keyboardType="number-pad" />
        <EnumPicker palette={palette} label="Programme" options={programmes} value={form.programme} onSelect={set('programme')} />
        <EnumPicker palette={palette} label="House" options={houses} value={form.house} onSelect={set('house')} />
      </Surface>

      <SectionTitle palette={palette} title="Professional" />
      <Surface palette={palette} style={styles.sectionCard}>
        <EnumPicker palette={palette} label="Employment type" options={employmentTypes} value={form.employmentType} onSelect={set('employmentType')} />
        <Field palette={palette} label="Occupation" value={form.occupation} onChangeText={set('occupation')} icon="briefcase-outline" />
        <Field palette={palette} label="Organization" value={form.organization} onChangeText={set('organization')} icon="business-outline" />
        <Field
          palette={palette}
          label="Areas of expertise"
          value={form.areaOfExpertise}
          onChangeText={set('areaOfExpertise')}
          placeholder="Finance, Engineering, Teaching"
          icon="pricetags-outline"
        />
        <Field
          palette={palette}
          label="Mentor bio"
          value={form.mentorBio}
          onChangeText={set('mentorBio')}
          placeholder="Share your focus areas, experience, and the kind of guidance you can offer."
          multiline
        />
      </Surface>

      <SectionTitle palette={palette} title="Emergency" />
      <Surface palette={palette} style={styles.sectionCard}>
        <Field palette={palette} label="Emergency contact" value={form.emergencyContactNumber} onChangeText={set('emergencyContactNumber')} icon="medkit-outline" keyboardType="phone-pad" />
        <Field palette={palette} label="Emergency relationship" value={form.emergencyRelationship} onChangeText={set('emergencyRelationship')} placeholder="e.g. Spouse" />
        <Field palette={palette} label="Next of kin name" value={form.nextOfKinName} onChangeText={set('nextOfKinName')} icon="person-outline" />
        <Field palette={palette} label="Next of kin contact" value={form.nextOfKinContact} onChangeText={set('nextOfKinContact')} icon="call-outline" keyboardType="phone-pad" />
        <Field palette={palette} label="Next of kin relationship" value={form.nextOfKinRelationship} onChangeText={set('nextOfKinRelationship')} placeholder="e.g. Brother" />
      </Surface>

      <View style={styles.saveWrap}>
        <PrimaryButton label="Save profile" palette={palette} onPress={onSave} loading={saving} icon="save-outline" />
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  photoCard: { padding: 18, alignItems: 'center', gap: 8 },
  photoName: { fontSize: 18, fontFamily: Fonts.display, marginTop: 4 },
  photoEmail: { fontSize: 13, fontFamily: Fonts.body },
  sectionCard: { padding: 14 },
  enumField: { marginBottom: 12 },
  enumLabel: { fontSize: 12, fontFamily: Fonts.bodySemiBold, marginBottom: 7 },
  enumRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  enumPill: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  enumPillText: { fontSize: 11, fontFamily: Fonts.statusBold, letterSpacing: 0.6, textTransform: 'uppercase' },
  saveWrap: { marginTop: 22 },
});
