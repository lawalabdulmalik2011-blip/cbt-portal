import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing authorization' }, 401);

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller } } = await userClient.auth.getUser();
    if (!caller) return json({ error: 'Invalid session' }, 401);

    const { attempt_id } = await req.json();
    if (!attempt_id) return json({ error: 'attempt_id required' }, 400);

    // Load attempt + verify ownership
    const { data: attempt, error: attErr } = await userClient
      .from('attempts')
      .select('*, exams ( pass_mark )')
      .eq('id', attempt_id)
      .maybeSingle();
    if (attErr || !attempt) return json({ error: 'Attempt not found' }, 404);
    if (attempt.student_id !== caller.id) {
      return json({ error: 'Not your attempt' }, 403);
    }

    // Service role client for grading
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Load answers + questions
    const { data: answers } = await admin
      .from('answers')
      .select('id, question_id, answer, questions(correct_answer, type, points)')
      .eq('attempt_id', attempt_id);

    let earned = 0;
    let total = 0;

    for (const a of answers ?? []) {
      const q = a.questions;
      const pts = q.points ?? 1;
      total += pts;

      let isCorrect = false;
      if (q.type === 'essay') {
        // Essays graded manually by teacher — skip
        await admin.from('answers').update({ is_correct: null }).eq('id', a.id);
        continue;
      }

      const expected = q.correct_answer;
      const given = a.answer;

      if (q.type === 'mcq' || q.type === 'true_false') {
        isCorrect = String(given) === String(expected);
      } else if (q.type === 'short_answer') {
        isCorrect = String(given).trim().toLowerCase() ===
                    String(expected).trim().toLowerCase();
      }

      if (isCorrect) earned += pts;
      await admin.from('answers').update({ is_correct: isCorrect }).eq('id', a.id);
    }

    // If no answers, fall back to total questions
    if (total === 0) {
      const { count } = await admin
        .from('exam_questions')
        .select('*', { count: 'exact', head: true })
        .eq('exam_id', attempt.exam_id);
      total = count ?? 0;
    }

    const score = total > 0 ? Math.round((earned / total) * 100) : 0;
    const passMark = attempt.exams?.pass_mark ?? 50;
    const passed = score >= passMark;

    await admin
      .from('attempts')
      .update({
        score,
        total_points: total,
        passed,
        submitted_at: new Date().toISOString(),
        status: 'submitted',
      })
      .eq('id', attempt_id);

    return json({ success: true, score, total_points: total, passed });
  } catch (err) {
    console.error('grade-attempt error:', err);
    return json({ error: err.message ?? 'Unexpected error' }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}