export interface Job {
  id: string
  title: string
  description: string
  user_id: string
  created_at: string
  candidate_count?: number
}

export interface CandidateAnalysis {
  summary: string
  strengths: string[]
  concerns: string[]
  recommendation: 'hire' | 'maybe' | 'pass'
}

export interface Candidate {
  id: string
  job_id: string
  name: string | null
  filename: string
  score: number | null
  analysis: CandidateAnalysis | null
  created_at: string
}
