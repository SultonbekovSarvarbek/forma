export const colors = {
  bg: '#0D0E10',
  surface: '#17191C',
  surface2: '#202327',
  border: '#2A2D32',
  text: '#F4F5F2',
  muted: '#9A9EA6',
  faint: '#5F646C',
  accent: '#C6F432',
  onAccent: '#0D0E10',
  info: '#5BD2F0',
  warn: '#F5B841',
  danger: '#FF6B5B',
};

export const radius = { sm: 10, md: 16, lg: 22, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const type = {
  hero: { fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.6, color: colors.text },
  h1: { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.4, color: colors.text },
  h2: { fontSize: 18, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, lineHeight: 21, color: colors.text },
  small: { fontSize: 13, lineHeight: 18, color: colors.muted },
  label: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.6, textTransform: 'uppercase' as const, color: colors.muted },
};
