import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

interface CustomSection {
  title: string;
  content: string;
}

interface ProposalData {
  title: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  totalBudget: number;
  currency: string;
  coverLetter: string;
  executiveSummary: string;
  problemStatement: string;
  proposedSolution: string;
  technicalArchitecture: string;
  projectTimeline: string;
  investmentPricing: string;
  termsConditions: string;
  customSections: CustomSection[];
  status: string;
  version: number;
  createdAt: string;
}

interface AgencyProfile {
  agency_name?: string;
  logo_url?: string;
  tagline?: string;
  contact_email?: string;
  website_url?: string;
  phone?: string;
  address?: string;
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
  brand_tone?: string;
  core_skills?: string[];
  preferred_tech_stack?: string[];
  base_hourly_rate?: number;
  currency?: string;
}

interface ProposalPDFDocumentProps {
  proposal: Partial<ProposalData>;
  agencyProfile: AgencyProfile;
  clientName: string;
  projectTitle: string;
}

// ═══════════════════════════════════════
// BRAND COLORS HELPER
// ═══════════════════════════════════════

function getBrandColors(agency: AgencyProfile) {
  return {
    primary: agency.primary_color || '#1a1a2e',
    secondary: agency.secondary_color || '#2563eb',
    primaryLight: adjustColor(agency.primary_color || '#1a1a2e', 30),
    secondaryLight: adjustColor(agency.secondary_color || '#2563eb', 30),
    primaryDark: adjustColor(agency.primary_color || '#1a1a2e', -20),
  };
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xFF) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xFF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xFF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// ═══════════════════════════════════════
// DYNAMIC STYLES (Uses Agency Branding)
// ═══════════════════════════════════════

function createStyles(agency: AgencyProfile) {
  const colors = getBrandColors(agency);

  return StyleSheet.create({
    // ── Page Layout ──
    page: {
      padding: 55,
      paddingBottom: 70,
      fontSize: 10.5,
      fontFamily: 'Helvetica',
      lineHeight: 1.7,
      color: '#333333',
    },
    
    // ── COVER PAGE ──
    coverPage: {
      padding: 60,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      backgroundColor: colors.primary,
    },
    coverLogoContainer: {
      marginBottom: 40,
      padding: 20,
      backgroundColor: '#ffffff',
      borderRadius: 12,
    },
    coverLogo: {
      width: 160,
      height: 70,
      objectFit: 'contain',
    },
    coverAgencyName: {
      fontSize: 18,
      color: colors.secondaryLight,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8,
      textTransform: 'uppercase' as const,
      letterSpacing: 3,
    },
    coverTitle: {
      fontSize: 34,
      color: '#ffffff',
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 1.3,
    },
    coverSubtitle: {
      fontSize: 14,
      color: '#cbd5e1',
      textAlign: 'center',
      marginBottom: 40,
      fontStyle: 'italic',
    },
    coverDivider: {
      borderTop: `3px solid ${colors.secondary}`,
      width: 180,
      marginVertical: 25,
    },
    coverLabel: {
      fontSize: 11,
      color: '#94a3b8',
      textAlign: 'center',
      marginBottom: 4,
      textTransform: 'uppercase' as const,
      letterSpacing: 2,
    },
    coverClientName: {
      fontSize: 22,
      color: '#ffffff',
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8,
    },
    coverClientCompany: {
      fontSize: 13,
      color: '#cbd5e1',
      textAlign: 'center',
      marginBottom: 30,
    },
    coverDate: {
      fontSize: 11,
      color: '#94a3b8',
      textAlign: 'center',
    },
    coverFooter: {
      position: 'absolute',
      bottom: 40,
      left: 60,
      right: 60,
      fontSize: 9,
      color: '#64748b',
      textAlign: 'center',
    },

    // ── CONTENT PAGES ──
    headerBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 25,
      paddingBottom: 12,
      borderBottom: `2px solid ${colors.secondary}`,
    },
    headerLogo: {
      width: 80,
      height: 30,
      objectFit: 'contain',
    },
    headerAgencyName: {
      fontSize: 9,
      color: '#888',
      textAlign: 'right',
    },
    headerConfidential: {
      fontSize: 7,
      color: '#aaa',
      textTransform: 'uppercase' as const,
      letterSpacing: 1,
    },

    // ── SECTION TITLES ──
    sectionTitle: {
      fontSize: 17,
      fontWeight: 'bold',
      color: colors.primary,
      marginTop: 28,
      marginBottom: 14,
      paddingBottom: 8,
      borderBottom: `2.5px solid ${colors.secondary}`,
    },
    section: {
      marginBottom: 18,
    },
    
    // ── TEXT ──
    paragraph: {
      fontSize: 10.5,
      lineHeight: 1.8,
      marginBottom: 8,
      color: '#444444',
      textAlign: 'justify' as const,
    },
    bulletPoint: {
      fontSize: 10.5,
      lineHeight: 1.8,
      marginLeft: 22,
      marginBottom: 5,
      color: '#444444',
    },
    bold: {
      fontWeight: 'bold',
      color: colors.primary,
    },

    // ── TABLE ──
    table: {
      marginVertical: 12,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 4,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: colors.primary,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    tableHeaderText: {
      color: '#ffffff',
      fontWeight: 'bold',
      fontSize: 9,
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
      paddingVertical: 7,
      paddingHorizontal: 12,
    },
    tableCell: {
      fontSize: 9,
      color: '#444',
    },

    // ── FOOTER ──
    footer: {
      position: 'absolute',
      bottom: 30,
      left: 55,
      right: 55,
      borderTop: `1.5px solid ${colors.secondary}40`,
      paddingTop: 10,
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    footerText: {
      fontSize: 7.5,
      color: '#999',
    },
    footerAgency: {
      fontSize: 8,
      color: colors.primary,
      fontWeight: 'bold',
    },
    pageNumber: {
      fontSize: 8,
      color: '#999',
    },

    // ── SIGNATURE PAGE ──
    signaturePage: {
      padding: 60,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      height: '100%',
      backgroundColor: '#f8fafc',
    },
    signatureSection: {
      marginTop: 50,
      padding: 25,
      borderWidth: 1.5,
      borderColor: colors.secondary,
      borderRadius: 8,
    },
    signatureLine: {
      borderTopWidth: 1,
      borderTopColor: '#333',
      marginTop: 50,
      paddingTop: 8,
    },
    signatureLabel: {
      fontSize: 10,
      color: '#666',
    },
    thankYouText: {
      fontSize: 28,
      color: colors.primary,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 20,
    },
    thankYouSubtext: {
      fontSize: 13,
      color: '#666',
      textAlign: 'center',
      lineHeight: 1.8,
    },
  });
}

// ═══════════════════════════════════════
// DEFAULTS
// ═══════════════════════════════════════

const DEFAULT_PROPOSAL: ProposalData = {
  title: 'Software Development Proposal',
  clientName: 'Valued Client',
  clientCompany: '',
  clientEmail: '',
  totalBudget: 0,
  currency: 'USD',
  coverLetter: '',
  executiveSummary: 'Executive summary will be provided upon request.',
  problemStatement: 'Problem statement will be provided upon request.',
  proposedSolution: 'Solution details will be provided upon request.',
  technicalArchitecture: 'Technical architecture will be provided upon request.',
  projectTimeline: 'Project timeline will be provided upon request.',
  investmentPricing: 'Investment details will be provided upon request.',
  termsConditions: 'Terms and conditions will be provided upon request.',
  customSections: [],
  status: 'draft',
  version: 1,
  createdAt: new Date().toISOString(),
};

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════

function mergeWithDefaults(partial: Partial<ProposalData>): ProposalData {
  return { ...DEFAULT_PROPOSAL, ...partial, customSections: partial.customSections || [] };
}

function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\\n/g, '\n').trim();
}

function renderParagraphs(text: string, styles: any): React.ReactNode {
  if (!text) return <Text style={styles.paragraph}>No content provided.</Text>;
  const cleaned = cleanText(text);
  const lines = cleaned.split('\n').filter(l => l.trim());
  if (lines.length === 0) return <Text style={styles.paragraph}>No content provided.</Text>;

  return (
    <>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('–')) {
          return <Text key={idx} style={styles.bulletPoint}>{trimmed}</Text>;
        }
        if (/^\d+[\.\)]\s/.test(trimmed)) {
          return <Text key={idx} style={styles.bulletPoint}>{trimmed}</Text>;
        }
        return <Text key={idx} style={styles.paragraph}>{trimmed}</Text>;
      })}
    </>
  );
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ═══════════════════════════════════════
// COVER PAGE
// ═══════════════════════════════════════

const CoverPage: React.FC<{
  title: string;
  clientName: string;
  clientCompany?: string;
  agency: AgencyProfile;
  styles: any;
}> = ({ title, clientName, clientCompany, agency, styles }) => (
  <Page size="A4" style={styles.coverPage}>
    {/* Agency Logo */}
    {agency.logo_url && (
      <View style={styles.coverLogoContainer}>
        <Image src={agency.logo_url} style={styles.coverLogo} />
      </View>
    )}
    
    {/* Agency Name */}
    <Text style={styles.coverAgencyName}>{agency.agency_name || 'GigThink'}</Text>
    
    {/* Proposal Title */}
    <Text style={styles.coverTitle}>{title}</Text>
    
    {/* Tagline */}
    {agency.tagline && (
      <Text style={styles.coverSubtitle}>"{agency.tagline}"</Text>
    )}
    
    {/* Divider */}
    <View style={styles.coverDivider} />
    
    {/* Client Info */}
    <Text style={styles.coverLabel}>Prepared Exclusively For</Text>
    <Text style={styles.coverClientName}>{clientName}</Text>
    {clientCompany && (
      <Text style={styles.coverClientCompany}>{clientCompany}</Text>
    )}
    
    {/* Date */}
    <Text style={styles.coverDate}>{getFormattedDate()}</Text>
    
    {/* Cover Footer */}
    <Text style={styles.coverFooter}>
      {agency.agency_name} | {agency.contact_email} | {agency.website_url}
    </Text>
  </Page>
);

// ═══════════════════════════════════════
// HEADER COMPONENT
// ═══════════════════════════════════════

const PageHeader: React.FC<{
  agency: AgencyProfile;
  title: string;
  styles: any;
}> = ({ agency, title, styles }) => (
  <View style={styles.headerBar} fixed>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {agency.logo_url && <Image src={agency.logo_url} style={styles.headerLogo} />}
      <View>
        <Text style={styles.headerAgencyName}>{agency.agency_name}</Text>
        <Text style={styles.headerConfidential}>CONFIDENTIAL PROPOSAL</Text>
      </View>
    </View>
    <Text style={{ fontSize: 7, color: '#aaa' }}>{getFormattedDate()}</Text>
  </View>
);

// ═══════════════════════════════════════
// FOOTER COMPONENT
// ═══════════════════════════════════════

const PageFooter: React.FC<{
  agency: AgencyProfile;
  clientName: string;
  pageNumber: number;
  styles: any;
}> = ({ agency, clientName, pageNumber, styles }) => (
  <View style={styles.footer} fixed>
    <View style={styles.footerRow}>
      <Text style={styles.footerAgency}>{agency.agency_name}</Text>
      <Text style={styles.footerText}>
        {agency.contact_email} | {agency.website_url}
      </Text>
      <Text style={styles.pageNumber}>Page {pageNumber}</Text>
    </View>
    <Text style={{ fontSize: 6.5, color: '#bbb', textAlign: 'center', marginTop: 4 }}>
      Confidential — Prepared for {clientName} — © {new Date().getFullYear()} {agency.agency_name}
    </Text>
  </View>
);

// ═══════════════════════════════════════
// SIGNATURE PAGE
// ═══════════════════════════════════════

const SignaturePage: React.FC<{
  agency: AgencyProfile;
  clientName: string;
  styles: any;
}> = ({ agency, clientName, styles }) => (
  <Page size="A4" style={styles.signaturePage}>
    <Text style={styles.thankYouText}>Thank You</Text>
    <Text style={styles.thankYouSubtext}>
      We appreciate the opportunity to present this proposal to {clientName}.{'\n'}
      At {agency.agency_name}, we are committed to delivering exceptional results{'\n'}
      that drive real business value.
    </Text>
    <Text style={{ ...styles.thankYouSubtext, marginTop: 15 }}>
      We look forward to partnering with you on this exciting journey.
    </Text>

    {/* Signature Block */}
    <View style={styles.signatureSection}>
      <Text style={{ ...styles.sectionTitle, marginTop: 0, fontSize: 14 }}>
        Agreement & Acceptance
      </Text>
      <Text style={styles.paragraph}>
        By signing below, {clientName} accepts the terms and conditions outlined in this proposal.
      </Text>

      <View style={{ flexDirection: 'row', marginTop: 40, gap: 40 }}>
        {/* Agency Side */}
        <View style={{ flex: 1 }}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>{agency.agency_name}</Text>
          <Text style={{ fontSize: 8, color: '#999', marginTop: 4 }}>Authorized Representative</Text>
          <Text style={{ fontSize: 8, color: '#999' }}>Date: _________________</Text>
        </View>

        {/* Client Side */}
        <View style={{ flex: 1 }}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>{clientName}</Text>
          <Text style={{ fontSize: 8, color: '#999', marginTop: 4 }}>Authorized Representative</Text>
          <Text style={{ fontSize: 8, color: '#999' }}>Date: _________________</Text>
        </View>
      </View>
    </View>

    {/* Contact Info */}
    <View style={{ marginTop: 50, alignItems: 'center' }}>
      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#333' }}>{agency.agency_name}</Text>
      {agency.tagline && <Text style={{ fontSize: 9, color: '#666', fontStyle: 'italic' }}>"{agency.tagline}"</Text>}
      <Text style={{ fontSize: 9, color: '#666', marginTop: 8 }}>
        {agency.contact_email} | {agency.website_url}
      </Text>
      {agency.address && <Text style={{ fontSize: 8, color: '#999' }}>{agency.address}</Text>}
    </View>
  </Page>
);

// ═══════════════════════════════════════
// MAIN PDF DOCUMENT
// ═══════════════════════════════════════

export const ProposalPDFDocument: React.FC<ProposalPDFDocumentProps> = ({
  proposal = {},
  agencyProfile = {},
  clientName,
  projectTitle,
}) => {
  const data = mergeWithDefaults({
    ...proposal,
    title: projectTitle || proposal.title || DEFAULT_PROPOSAL.title,
    clientName: clientName || proposal.clientName || DEFAULT_PROPOSAL.clientName,
  });

  const agency: AgencyProfile = {
    agency_name: agencyProfile.agency_name || 'GigThink Technologies',
    logo_url: agencyProfile.logo_url || '',
    tagline: agencyProfile.tagline || '',
    contact_email: agencyProfile.contact_email || '',
    website_url: agencyProfile.website_url || '',
    phone: agencyProfile.phone || '',
    address: agencyProfile.address || '',
    primary_color: agencyProfile.primary_color || '#1a1a2e',
    secondary_color: agencyProfile.secondary_color || '#2563eb',
    brand_tone: agencyProfile.brand_tone || '',
    core_skills: agencyProfile.core_skills || [],
    preferred_tech_stack: agencyProfile.preferred_tech_stack || [],
    base_hourly_rate: agencyProfile.base_hourly_rate || 50,
    currency: agencyProfile.currency || 'USD',
  };

  const styles = createStyles(agency);
  const budgetDisplay = data.totalBudget > 0
    ? `${data.currency} ${data.totalBudget.toLocaleString()}`
    : 'To be discussed';

  return (
    <Document>
      {/* ── COVER PAGE ── */}
      <CoverPage
        title={data.title}
        clientName={data.clientName}
        clientCompany={data.clientCompany}
        agency={agency}
        styles={styles}
      />

      {/* ── CONTENT PAGES ── */}
      <Page size="A4" style={styles.page}>
        <PageHeader agency={agency} title={data.title} styles={styles} />

        {data.coverLetter && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cover Letter</Text>
            {renderParagraphs(data.coverLetter, styles)}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Executive Summary</Text>
          {renderParagraphs(data.executiveSummary, styles)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Problem Statement</Text>
          {renderParagraphs(data.problemStatement, styles)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Proposed Solution</Text>
          {renderParagraphs(data.proposedSolution, styles)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Technical Architecture</Text>
          {renderParagraphs(data.technicalArchitecture, styles)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Project Timeline</Text>
          {renderParagraphs(data.projectTimeline, styles)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Investment & Pricing</Text>
          <Text style={{ ...styles.paragraph, fontWeight: 'bold' }}>
            Total Investment: {budgetDisplay}
          </Text>
          {renderParagraphs(data.investmentPricing, styles)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Terms & Conditions</Text>
          {renderParagraphs(data.termsConditions, styles)}
        </View>

        {data.customSections?.map((section, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {renderParagraphs(section.content, styles)}
          </View>
        ))}

        <PageFooter agency={agency} clientName={data.clientName} pageNumber={1} styles={styles} />
      </Page>

      {/* ── SIGNATURE PAGE ── */}
      <SignaturePage agency={agency} clientName={data.clientName} styles={styles} />
    </Document>
  );
};