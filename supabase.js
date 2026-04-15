import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://lvuxstpmbumxqolvamlo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dXhzdHBtYnVteHFvbHZhbWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5ODg5MzgsImV4cCI6MjA5MDU2NDkzOH0.NHbuNI2yZzKeEPNqAEblPt2nxnUN307cUQTHNA7rIco' // chave pública — segura para o frontend
)

async function submitLead(formData) {
  const { error } = await supabase
    .from('leads')
    .insert({
      name:    formData.name,
      email:   formData.email,
      company: formData.company,
      plan:    formData.plan // 'Starter' | 'Growth' | 'Enterprise'
    })

  if (error) {
    console.error('Erro ao salvar lead:', error.message)
    return false
  }
  return true
}
