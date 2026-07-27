import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Brand, Colors, Fonts, type Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { authApi } from '@/lib/api';
import type { Gender, House, Programme, WillingnessToVolunteer } from '@/lib/types';
import { Field, HeroPanel, IconTile, PrimaryButton, ProgressBar, ScreenScroll, Surface } from '@/components/mobile-ui';
import { DateField } from '@/components/date-field';
import { AuthLogo } from '@/components/auth-logo';
import { AuthBrandPanel } from '@/components/auth-brand-panel';
import { SelectField } from '@/components/select-field';
import { cityOptions, countryOptions, stateOptions } from '@/lib/locations';

const EXPERTISE_OPTIONS = [
  'Education & Teaching', 'Healthcare & Medical Services', 'Engineering & Technical Fields',
  'Information Technology (IT)', 'Business & Entrepreneurship', 'Finance, Banking & Accounting',
  'Law & Legal Services', 'Public Service & Government', 'Security, Military & Law Enforcement',
  'Media, Communications & Creative Arts', 'Agriculture & Environmental Services',
  'Construction & Skilled Trades', 'Sales, Marketing & Customer Relations',
  'Human Resources & Administration', 'Research & Academia',
  'Non-Profit & Community Development', 'Religious & Ministry Work',
  'Student (Further Studies)', 'Retired', 'Not Currently Employed', 'Other',
];

const CONTRIBUTION_OPTIONS = [
  'Education & Mentorship', 'Fundraising & Projects', 'Welfare',
  'Events & Reunions', 'Media & Communications', 'Other',
];

// Mirrors the web register wizard's option sets (apps/alumni RegisterPage).
const genders: Gender[] = ['MALE', 'FEMALE', 'OTHER'];
const maritalStatuses = ['SINGLE', 'MARRIED', 'SEPARATED', 'DIVORCED', 'WIDOWED'];
const programmes: Programme[] = ['GENERAL_ARTS', 'BUSINESS', 'HOME_ECONOMICS', 'VISUAL_ARTS', 'SCIENCE'];
const houses: House[] = ['ACKAH', 'DENSU', 'TANO', 'NKRUMAH', 'PRA', 'VOLTA'];
const employmentTypes = ['RETIRED', 'STUDENT', 'UNEMPLOYED', 'SELF_EMPLOYED', 'GOVERNMENT_WORKER', 'PRIVATE_WORKER'];
const willingnessOptions: WillingnessToVolunteer[] = ['YES', 'NO', 'MAYBE'];

const TOTAL_STEPS = 6;

const stepInfo: { icon: keyof typeof Ionicons.glyphMap; label: string; title: string; desc: string }[] = [
  { icon: 'person-outline', label: 'Personal', title: 'Personal Information', desc: 'Your basic details and account credentials' },
  { icon: 'call-outline', label: 'Contact', title: 'Contact Details', desc: 'How we can reach you' },
  { icon: 'school-outline', label: 'Academic', title: 'Academic Background', desc: 'Your time at University Practice' },
  { icon: 'briefcase-outline', label: 'Professional', title: 'Professional Info', desc: 'Your career and expertise' },
  { icon: 'medkit-outline', label: 'Emergency', title: 'Emergency & Engagement', desc: 'Emergency contacts and involvement' },
  { icon: 'shield-checkmark-outline', label: 'Consent', title: 'Consent & Declaration', desc: 'Review and confirm your registration' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegisterForm = {
  fullName: string;
  gender: string;
  dateOfBirth: string;
  maritalStatus: string;
  email: string;
  password: string;
  confirmPassword: string;
  mobileNumber: string;
  altPhoneNumber: string;
  residentialAddress: string;
  city: string;
  region: string;
  country: string;
  yearGroup: string;
  programme: string;
  house: string;
  employmentType: string;
  occupation: string;
  organization: string;
  areaOfExpertise: string[];
  emergencyContactNumber: string;
  emergencyRelationship: string;
  nextOfKinName: string;
  nextOfKinContact: string;
  nextOfKinRelationship: string;
  isWhatsAppMember: boolean;
  willingToVolunteer: string;
  preferredContributions: string[];
  consentGiven: boolean;
};

type FormErrors = Partial<Record<keyof RegisterForm, string>>;

const initialForm: RegisterForm = {
  fullName: '',
  gender: '',
  dateOfBirth: '',
  maritalStatus: '',
  email: '',
  password: '',
  confirmPassword: '',
  mobileNumber: '',
  altPhoneNumber: '',
  residentialAddress: '',
  city: '',
  region: '',
  country: 'Ghana',
  yearGroup: '',
  programme: '',
  house: '',
  employmentType: '',
  occupation: '',
  organization: '',
  areaOfExpertise: [],
  emergencyContactNumber: '',
  emergencyRelationship: '',
  nextOfKinName: '',
  nextOfKinContact: '',
  nextOfKinRelationship: '',
  isWhatsAppMember: false,
  willingToVolunteer: '',
  preferredContributions: [],
  consentGiven: false,
};

function formatEnumLabel(value: string) {
  return value
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

function EnumPicker({
  palette,
  label,
  options,
  value,
  onSelect,
}: {
  palette: Palette;
  label: string;
  options: string[];
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

function ChipMultiSelect({
  palette,
  label,
  options,
  values,
  onToggle,
}: {
  palette: Palette;
  label: string;
  options: string[];
  values: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <View style={styles.enumField}>
      <Text style={[styles.enumLabel, { color: palette.text }]}>{label}</Text>
      <View style={styles.enumRow}>
        {options.map((option) => {
          const active = values.includes(option);
          return (
            <Pressable
              key={option}
              onPress={() => onToggle(option)}
              style={({ pressed }) => [
                styles.enumPill,
                {
                  backgroundColor: active ? Brand.gold : palette.surfaceMuted,
                  borderColor: active ? Brand.gold : palette.border,
                  opacity: pressed ? 0.78 : 1,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: active ? Brand.navy : palette.textMuted }]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
      {values.length > 0 ? (
        <Text style={[styles.chipCount, { color: palette.tint }]}>{values.length} selected</Text>
      ) : null}
    </View>
  );
}

function CheckRow({
  palette,
  label,
  checked,
  onToggle,
  error,
}: {
  palette: Palette;
  label: string;
  checked: boolean;
  onToggle: () => void;
  error?: boolean;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [
        styles.checkRow,
        {
          backgroundColor: palette.background,
          borderColor: error ? palette.danger : palette.border,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={22} color={checked ? Brand.gold : palette.textMuted} />
      <Text style={[styles.checkLabel, { color: palette.text }]}>{label}</Text>
    </Pressable>
  );
}

function FieldError({ palette, message }: { palette: Palette; message?: string }) {
  if (!message) return null;
  return <Text style={[styles.errorText, { color: palette.danger }]}>{message}</Text>;
}

function validateStep(step: number, form: RegisterForm): FormErrors {
  const errs: FormErrors = {};
  if (step === 1) {
    if (form.fullName.length < 2) errs.fullName = 'Full name is required';
    if (!EMAIL_RE.test(form.email)) errs.email = 'Enter a valid email';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
  }
  if (step === 2) {
    if (form.mobileNumber.length < 5) errs.mobileNumber = 'Mobile number is required';
  }
  if (step === 3 && form.yearGroup !== '') {
    const year = Number(form.yearGroup);
    if (!/^\d{4}$/.test(form.yearGroup) || year < 1981 || year > 2026) {
      errs.yearGroup = 'Enter a completion year between 1981 and 2026';
    }
  }
  if (step === 6) {
    if (!form.consentGiven) errs.consentGiven = 'You must consent to proceed';
  }
  return errs;
}

export default function RegisterScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  const [form, setForm] = useState<RegisterForm>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [step, setStep] = useState(1);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const set = <K extends keyof RegisterForm>(key: K) => (value: RegisterForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const toggleArrayField = (key: 'areaOfExpertise' | 'preferredContributions') => (value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter((item) => item !== value) : [...prev[key], value],
    }));
  };

  const onContinue = () => {
    const errs = validateStep(step, form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  const onSubmit = async () => {
    // The web submits the full schema, so re-check every step's rules first.
    for (let s = 1; s <= TOTAL_STEPS; s += 1) {
      const errs = validateStep(s, form);
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        setStep(s);
        return;
      }
    }

    setLoading(true);
    try {
      // Multipart payload mirrors the web page: every non-empty field except
      // confirmPassword; arrays are JSON-stringified; booleans sent as strings.
      const formData = new FormData();
      const textKeys = [
        'fullName', 'gender', 'dateOfBirth', 'maritalStatus', 'password', 'mobileNumber',
        'altPhoneNumber', 'email', 'residentialAddress', 'city', 'region', 'country',
        'programme', 'house', 'employmentType', 'occupation', 'organization',
        'emergencyContactNumber', 'emergencyRelationship', 'nextOfKinName',
        'nextOfKinContact', 'nextOfKinRelationship', 'willingToVolunteer',
      ] as const;
      for (const key of textKeys) {
        if (form[key] !== '') formData.append(key, form[key]);
      }
      if (form.yearGroup !== '') formData.append('yearGroup', String(Number(form.yearGroup)));
      formData.append('areaOfExpertise', JSON.stringify(form.areaOfExpertise));
      formData.append('preferredContributions', JSON.stringify(form.preferredContributions));
      formData.append('isWhatsAppMember', String(form.isWhatsAppMember));
      formData.append('consentGiven', String(form.consentGiven));

      await authApi.register(formData);
      setRegistered(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Registration failed. Please try again.';
      Alert.alert('Registration failed', msg);
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <ScreenScroll palette={palette} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <AuthLogo />
        <HeroPanel
          palette={palette}
          eyebrow="Registration received"
          title="Welcome to the network."
          body="Your alumni record has been created and is awaiting verification."
          icon="ribbon-outline"
        />
        <Surface palette={palette} style={styles.successCard}>
          <IconTile icon="checkmark-done" palette={palette} tone="gold" size={26} />
          <Text style={[styles.successTitle, { color: palette.text }]}>Check your email to verify your account</Text>
          <Text style={[styles.successBody, { color: palette.textMuted }]}>
            We&apos;ve sent a verification link to {form.email}. Verify your email, then sign in once executives approve your record.
          </Text>
          <PrimaryButton
            label="Back to sign in"
            palette={palette}
            onPress={() => router.replace('/(auth)/login')}
            icon="log-in-outline"
            tone="cream"
          />
        </Surface>
      </ScreenScroll>
    );
  }

  const info = stepInfo[step - 1];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: palette.background }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 28 }}
        keyboardShouldPersistTaps="handled"
      >
        <AuthBrandPanel
          palette={palette}
          eyebrow="Join the network"
          title="Create your alumni record with care."
          body="Add the details that help UPOSA verify your profile, connect your year group, and keep you close to the school."
        />

        <View style={styles.formZone}>
          <Surface palette={palette} style={styles.card}>
          <View style={styles.stepHeader}>
            <View style={styles.stepHeaderText}>
              <Text style={[styles.stepEyebrow, { color: Brand.gold }]}>
                Step {step} of {TOTAL_STEPS} · {info.label}
              </Text>
              <Text style={[styles.stepTitle, { color: palette.text }]}>{info.title}</Text>
              <Text style={[styles.stepDesc, { color: palette.textMuted }]}>{info.desc}</Text>
            </View>
            <IconTile icon={info.icon} palette={palette} tone="muted" />
          </View>

          <View style={styles.progressRow}>
            {stepInfo.map((item, index) => {
              const num = index + 1;
              const reached = step >= num;
              return (
                <View
                  key={item.label}
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor: reached ? Brand.gold : palette.surfaceMuted,
                      borderColor: reached ? Brand.gold : palette.border,
                    },
                  ]}
                />
              );
            })}
          </View>
          <ProgressBar palette={palette} percent={(step / TOTAL_STEPS) * 100} style={styles.progressBar} />

          {step === 1 ? (
            <View>
              <Field
                palette={palette}
                label="Full name *"
                value={form.fullName}
                onChangeText={set('fullName')}
                placeholder="Kwame Mensah"
                icon="person-outline"
                autoCapitalize="words"
              />
              <FieldError palette={palette} message={errors.fullName} />
              <EnumPicker palette={palette} label="Gender" options={genders} value={form.gender} onSelect={set('gender')} />
              <DateField
                palette={palette}
                label="Date of birth"
                value={form.dateOfBirth}
                onChange={set('dateOfBirth')}
              />
              <EnumPicker
                palette={palette}
                label="Marital status"
                options={maritalStatuses}
                value={form.maritalStatus}
                onSelect={set('maritalStatus')}
              />

              <Text style={[styles.groupLabel, { color: palette.textMuted }]}>Account credentials</Text>
              <Field
                palette={palette}
                label="Email *"
                value={form.email}
                onChangeText={set('email')}
                placeholder="you@example.com"
                icon="mail-outline"
                keyboardType="email-address"
              />
              <FieldError palette={palette} message={errors.email} />
              <Field
                palette={palette}
                label="Password *"
                value={form.password}
                onChangeText={set('password')}
                placeholder="At least 8 characters"
                icon="lock-closed-outline"
                secureTextEntry={!showPw}
                autoCapitalize="none"
                right={
                  <Pressable onPress={() => setShowPw((value) => !value)} hitSlop={10}>
                    <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={palette.textMuted} />
                  </Pressable>
                }
              />
              <FieldError palette={palette} message={errors.password} />
              <Field
                palette={palette}
                label="Confirm password *"
                value={form.confirmPassword}
                onChangeText={set('confirmPassword')}
                placeholder="Repeat password"
                icon="lock-closed-outline"
                secureTextEntry
                autoCapitalize="none"
              />
              <FieldError palette={palette} message={errors.confirmPassword} />
            </View>
          ) : null}

          {step === 2 ? (
            <View>
              <Field
                palette={palette}
                label="Mobile number *"
                value={form.mobileNumber}
                onChangeText={set('mobileNumber')}
                placeholder="+233 XX XXX XXXX"
                icon="call-outline"
                keyboardType="phone-pad"
              />
              <FieldError palette={palette} message={errors.mobileNumber} />
              <Field
                palette={palette}
                label="Alternative phone"
                value={form.altPhoneNumber}
                onChangeText={set('altPhoneNumber')}
                placeholder="Optional"
                icon="call-outline"
                keyboardType="phone-pad"
              />
              <Field
                palette={palette}
                label="Residential address"
                value={form.residentialAddress}
                onChangeText={set('residentialAddress')}
                placeholder="Street address"
                icon="home-outline"
              />
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
            </View>
          ) : null}

          {step === 3 ? (
            <View>
              <Field
                palette={palette}
                label="Year group (year of completion)"
                value={form.yearGroup}
                onChangeText={set('yearGroup')}
                placeholder="e.g. 2008 (1981 to present)"
                icon="school-outline"
                keyboardType="number-pad"
              />
              <FieldError palette={palette} message={errors.yearGroup} />
              <EnumPicker
                palette={palette}
                label="Programme of study"
                options={programmes}
                value={form.programme}
                onSelect={set('programme')}
              />
              <EnumPicker palette={palette} label="House" options={houses} value={form.house} onSelect={set('house')} />
            </View>
          ) : null}

          {step === 4 ? (
            <View>
              <EnumPicker
                palette={palette}
                label="Employment type"
                options={employmentTypes}
                value={form.employmentType}
                onSelect={set('employmentType')}
              />
              <Field
                palette={palette}
                label="Occupation"
                value={form.occupation}
                onChangeText={set('occupation')}
                placeholder="e.g. Teacher, Engineer"
                icon="briefcase-outline"
              />
              <Field
                palette={palette}
                label="Organization"
                value={form.organization}
                onChangeText={set('organization')}
                placeholder="Place of work"
                icon="business-outline"
              />
              <ChipMultiSelect
                palette={palette}
                label="Area of expertise"
                options={EXPERTISE_OPTIONS}
                values={form.areaOfExpertise}
                onToggle={toggleArrayField('areaOfExpertise')}
              />
            </View>
          ) : null}

          {step === 5 ? (
            <View>
              <Text style={[styles.groupLabel, { color: palette.textMuted }]}>Emergency contact</Text>
              <Field
                palette={palette}
                label="Contact number"
                value={form.emergencyContactNumber}
                onChangeText={set('emergencyContactNumber')}
                icon="medkit-outline"
                keyboardType="phone-pad"
              />
              <Field
                palette={palette}
                label="Relationship"
                value={form.emergencyRelationship}
                onChangeText={set('emergencyRelationship')}
                placeholder="e.g. Spouse, Parent"
              />

              <Text style={[styles.groupLabel, { color: palette.textMuted }]}>Next of kin</Text>
              <Field
                palette={palette}
                label="Full name"
                value={form.nextOfKinName}
                onChangeText={set('nextOfKinName')}
                icon="person-outline"
                autoCapitalize="words"
              />
              <Field
                palette={palette}
                label="Contact number"
                value={form.nextOfKinContact}
                onChangeText={set('nextOfKinContact')}
                icon="call-outline"
                keyboardType="phone-pad"
              />
              <Field
                palette={palette}
                label="Relationship"
                value={form.nextOfKinRelationship}
                onChangeText={set('nextOfKinRelationship')}
                placeholder="e.g. Brother, Sister"
              />

              <Text style={[styles.groupLabel, { color: palette.textMuted }]}>Association engagement</Text>
              <CheckRow
                palette={palette}
                label="I am a member of my Year Group WhatsApp platform"
                checked={form.isWhatsAppMember}
                onToggle={() => set('isWhatsAppMember')(!form.isWhatsAppMember)}
              />
              <EnumPicker
                palette={palette}
                label="Willing to volunteer or serve on a committee?"
                options={willingnessOptions}
                value={form.willingToVolunteer}
                onSelect={set('willingToVolunteer')}
              />
              <ChipMultiSelect
                palette={palette}
                label="Preferred contribution areas"
                options={CONTRIBUTION_OPTIONS}
                values={form.preferredContributions}
                onToggle={toggleArrayField('preferredContributions')}
              />
            </View>
          ) : null}

          {step === 6 ? (
            <View>
              <Surface palette={palette} tone="muted" style={styles.consentCard}>
                <Text style={[styles.consentTitle, { color: palette.text }]}>Consent & Declaration</Text>
                <Text style={[styles.consentBody, { color: palette.textMuted }]}>
                  I confirm that the information provided is accurate and consent to being contacted by the Old
                  Students Association for official purposes.
                </Text>
                {[
                  'The information I have provided is true and accurate',
                  'I consent to UPOSA contacting me for official purposes',
                  'I agree to abide by the UPOSA constitution and bylaws',
                ].map((item) => (
                  <View key={item} style={styles.consentItem}>
                    <Ionicons name="checkmark-circle" size={16} color={palette.success} />
                    <Text style={[styles.consentItemText, { color: palette.textMuted }]}>{item}</Text>
                  </View>
                ))}
              </Surface>
              <CheckRow
                palette={palette}
                label="I agree to all of the above *"
                checked={form.consentGiven}
                onToggle={() => set('consentGiven')(!form.consentGiven)}
                error={!!errors.consentGiven}
              />
              <FieldError palette={palette} message={errors.consentGiven} />
            </View>
          ) : null}

          <View style={styles.navRow}>
            {step > 1 ? (
              <View style={styles.navButton}>
                <PrimaryButton
                  label="Back"
                  palette={palette}
                  onPress={() => setStep((prev) => Math.max(prev - 1, 1))}
                  icon="arrow-back"
                  tone="outline"
                  disabled={loading}
                />
              </View>
            ) : null}
            <View style={styles.navButton}>
              {step < TOTAL_STEPS ? (
                <PrimaryButton label="Continue" palette={palette} onPress={onContinue} icon="arrow-forward" tone="cream" />
              ) : (
                <PrimaryButton
                  label="Create account"
                  palette={palette}
                  onPress={onSubmit}
                  loading={loading}
                  icon="person-add-outline"
                  tone="cream"
                />
              )}
            </View>
          </View>

          <View style={styles.signInRow}>
            <Link href="/(auth)/login" asChild>
              <Pressable hitSlop={8}>
                <Text style={{ color: palette.textMuted, fontSize: 14, fontFamily: Fonts.body }}>
                  Already approved? <Text style={{ color: Brand.gold, fontFamily: Fonts.bodyBold }}>Sign in</Text>
                </Text>
              </Pressable>
            </Link>
          </View>
        </Surface>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  formZone: { paddingHorizontal: 16, marginTop: -28 },
  card: { padding: 16 },
  stepHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 14 },
  stepHeaderText: { flex: 1 },
  stepEyebrow: { fontSize: 11, fontFamily: Fonts.statusBold, letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 6 },
  stepTitle: { fontSize: 22, fontFamily: Fonts.display, lineHeight: 26 },
  stepDesc: { fontSize: 13, fontFamily: Fonts.body, lineHeight: 18, marginTop: 5 },
  progressRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  progressDot: { flex: 1, height: 6, borderWidth: 1 },
  progressBar: { marginBottom: 18 },
  groupLabel: {
    fontSize: 11,
    fontFamily: Fonts.statusBold,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 12,
  },
  enumField: { marginBottom: 12 },
  enumLabel: { fontSize: 12, fontFamily: Fonts.bodySemiBold, marginBottom: 7 },
  enumRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  enumPill: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  enumPillText: { fontSize: 11, fontFamily: Fonts.statusBold, letterSpacing: 0.6, textTransform: 'uppercase' },
  chipText: { fontSize: 12, fontFamily: Fonts.bodyMedium },
  chipCount: { fontSize: 12, fontFamily: Fonts.bodySemiBold, marginTop: 7 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  checkLabel: { flex: 1, fontSize: 14, fontFamily: Fonts.bodyMedium, lineHeight: 19 },
  errorText: { fontSize: 12, fontFamily: Fonts.body, marginTop: -6, marginBottom: 10 },
  consentCard: { padding: 14, gap: 8, marginBottom: 14 },
  consentTitle: { fontSize: 15, fontFamily: Fonts.bodyBold },
  consentBody: { fontSize: 13, fontFamily: Fonts.body, lineHeight: 19 },
  consentItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  consentItemText: { flex: 1, fontSize: 13, fontFamily: Fonts.body, lineHeight: 18 },
  navRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  navButton: { flex: 1 },
  signInRow: { alignItems: 'center', paddingTop: 16 },
  successCard: { padding: 22, alignItems: 'center', gap: 12 },
  successTitle: { fontSize: 18, fontFamily: Fonts.display, textAlign: 'center' },
  successBody: { fontSize: 13, fontFamily: Fonts.body, lineHeight: 19, textAlign: 'center' },
});
