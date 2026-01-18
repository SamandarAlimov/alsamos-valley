import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const inputSchema = z.object({
  roomName: z.string().trim().min(1, "Room name is required").max(200, "Room name too long"),
  hub: z.string().trim().min(1, "Hub is required").max(100, "Hub name too long"),
  description: z.string().trim().min(1, "Description is required").max(5000, "Description too long"),
  roomType: z.string().trim().min(1, "Room type is required").max(50, "Room type too long"),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    const rawInput = await req.json();
    const validationResult = inputSchema.safeParse(rawInput);
    
    if (!validationResult.success) {
      console.error('Input validation failed:', validationResult.error.errors);
      return new Response(JSON.stringify({ 
        error: 'Invalid input', 
        details: validationResult.error.errors.map(e => e.message) 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { roomName, hub, description, roomType } = validationResult.data;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an AI business analyst for Alsamos Valley, an innovation ecosystem. Analyze startup and project ideas to provide actionable insights.

Given a room/project description, provide:
1. A 3-phase roadmap with specific tasks
2. Recommended team roles (4-6 roles)
3. Budget estimate range based on scope
4. Success score (0-100) based on clarity, market potential, feasibility
5. Risk score (0-100) based on competition, complexity, market uncertainty

Respond in valid JSON format only.`;

    const userPrompt = `Analyze this innovation room:
Name: ${roomName}
Hub Category: ${hub}
Room Type: ${roomType}
Description: ${description}

Provide your analysis in this exact JSON format:
{
  "roadmap": [
    {"phase": "Phase 1: Foundation (Months 1-2)", "tasks": ["task1", "task2", "task3"]},
    {"phase": "Phase 2: Development (Months 3-4)", "tasks": ["task1", "task2", "task3"]},
    {"phase": "Phase 3: Growth (Months 5-6)", "tasks": ["task1", "task2", "task3"]}
  ],
  "teamSuggestions": ["Role 1", "Role 2", "Role 3", "Role 4"],
  "budgetEstimate": "$X,XXX - $XX,XXX",
  "successScore": 75,
  "riskScore": 35
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in analyze-room function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
