import Anthropic from '@anthropic-ai/sdk'
import type { CandidateAnalysis } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function analyzeResume(
  jobTitle: string,
  jobDescription: string,
  resumeText: string
): Promise<CandidateAnalysis & { score: number }> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are an expert recruiter analyzing a job application. Return ONLY valid JSON, no markdown, no explanation.

Job Title: ${jobTitle}
Job Description:
${jobDescription}

Resume:
${resumeText.slice(0, 6000)}

Respond with this exact JSON structure:
{
  "score": <integer 0-100>,
  "summary": "<2-3 sentence overview of fit>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "concerns": ["<concern 1>"],
  "recommendation": "<hire|maybe|pass>"
}`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return JSON.parse(text)
}
