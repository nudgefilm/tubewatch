'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestSupabasePage() {
  const [data, setData] = useState<any[]>([])
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('analysis_jobs')
        .select('*')
        .limit(5)

      if (error) {
        setError(error.message)
        return
      }

      setData(data || [])
    }

    fetchData()
  }, [])

  return (
    <main style={{ padding: 24 }}>
      <h1>Supabase Connection Test</h1>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  )
}