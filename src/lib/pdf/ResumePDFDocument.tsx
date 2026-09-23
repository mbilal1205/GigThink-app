import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { StructuredResume } from '@/lib/ai/resume-tailor';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headline: {
    fontSize: 14,
    color: '#333333',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    marginTop: 20,
    marginBottom: 10,
  },
  summary: {
    fontSize: 10,
    lineHeight: 1.5,
  },
  skillList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skill: {
    fontSize: 10,
    marginRight: 8,
    marginBottom: 4,
  },
  workItem: {
    marginBottom: 10,
  },
  companyTitle: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  dates: {
    fontSize: 9,
    color: '#666666',
  },
  achievement: {
    fontSize: 10,
    marginLeft: 10,
    marginTop: 2,
  },
});

export const ResumePDFDocument = ({ resume }: { resume: StructuredResume }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.name}>{resume.fullName}</Text>
        <Text style={styles.headline}>{resume.headline}</Text>
      </View>

      <Text style={styles.sectionTitle}>Professional Summary</Text>
      <Text style={styles.summary}>{resume.summary}</Text>

      <Text style={styles.sectionTitle}>Skills</Text>
      <View style={styles.skillList}>
        {resume.skills.map((skill, index) => (
          <Text key={index} style={styles.skill}>{skill}</Text>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Work Experience</Text>
      {resume.workExperience.map((exp, index) => (
        <View key={index} style={styles.workItem}>
          <Text style={styles.companyTitle}>{exp.title} - {exp.company}</Text>
          <Text style={styles.dates}>{exp.startDate} - {exp.endDate || 'Present'}</Text>
          {exp.achievements.map((ach, i) => (
            <Text key={i} style={styles.achievement}>â€¢ {ach}</Text>
          ))}
        </View>
      ))}

      <Text style={styles.sectionTitle}>Projects</Text>
      {resume.projects.map((proj, index) => (
        <View key={index} style={styles.workItem}>
          <Text style={styles.companyTitle}>{proj.name}</Text>
          <Text style={styles.achievement}>{proj.description}</Text>
          <Text style={styles.achievement}>Technologies: {proj.technologies.join(', ')}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Education</Text>
      {resume.education.map((edu, index) => (
        <View key={index} style={styles.workItem}>
          <Text style={styles.companyTitle}>{edu.degree} in {edu.field}</Text>
          <Text style={styles.dates}>{edu.institution} {edu.startDate} - {edu.endDate || 'Present'}</Text>
        </View>
      ))}

      {resume.certifications && resume.certifications.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Certifications</Text>
          {resume.certifications.map((cert, index) => (
            <Text key={index} style={styles.achievement}>â€¢ {cert}</Text>
          ))}
        </>
      )}
    </Page>
  </Document>
);