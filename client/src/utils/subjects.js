import { getClassData } from './auth'

// Default subjects for backward compatibility
const DEFAULT_SUBJECTS = [
  { key: 'English', label: 'English' },
  { key: 'Hindi', label: 'Hindi' },
  { key: 'Maths', label: 'Maths' },
  { key: 'Science', label: 'Science' },
  { key: 'Social Science', label: 'Social Science' }
]

// Get subjects for the current user's class
export function getSubjects() {
  const classData = getClassData()
  if (classData && classData.subjects && Array.isArray(classData.subjects)) {
    return classData.subjects.map(s => ({ key: s, label: s }))
  }
  return DEFAULT_SUBJECTS
}

export function getSubjectKeys() {
  return getSubjects().map(s => s.key)
}

// For backward compatibility
export const SUBJECTS = getSubjects()
export const SUBJECT_KEYS = getSubjectKeys()
