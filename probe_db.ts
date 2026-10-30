import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Testing Supabase URL:', url);
const supabase = createClient(url, key);

async function main() {
  console.log('=== DATABASE PROBE RESULTS ===');
  const tables = [
    'learnai_users',
    'students',
    'mentors',
    'trainers',
    'courses',
    'student_features',
    'skill_assessments'
  ];

  for (const t of tables) {
    const { data, count, error } = await supabase
      .from(t)
      .select('*', { count: 'exact' })
      .limit(3);

    console.log(`Table '${t}':`, {
      count,
      returnedRows: data?.length ?? 0,
      errorCode: error?.code ?? null,
      errorMessage: error?.message ?? null,
      sample: data ? data.slice(0, 1) : null
    });
  }
}

main().catch(console.error);
