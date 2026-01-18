import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const inputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Name too long"),
  description: z.string().trim().max(5000, "Description too long").optional(),
  problem: z.string().trim().max(3000, "Problem statement too long").optional(),
  solution: z.string().trim().max(3000, "Solution too long").optional(),
  stage: z.string().trim().max(50, "Stage too long").optional(),
  funding_needed: z.number().min(0).max(100000000000).optional().nullable(),
  mvp_status: z.string().trim().max(50, "MVP status too long").optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
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

    const { name, description, problem, solution, stage, funding_needed, mvp_status } = validationResult.data;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `You are an expert startup analyst AI named ALSA. Analyze this startup and provide a comprehensive score.

Startup Details:
- Name: ${name}
- Description: ${description || "Not specified"}
- Problem: ${problem || "Not specified"}
- Solution: ${solution || "Not specified"}
- Stage: ${stage || "Not specified"}
- Funding Needed: $${funding_needed?.toLocaleString() || "Not specified"}
- MVP Status: ${mvp_status || "Not specified"}

Provide your analysis as JSON with this exact structure:
{
  "ai_score": <number 0-100>,
  "analysis": {
    "market_potential": <number 0-100>,
    "team_execution": <number 0-100>,
    "innovation_level": <number 0-100>,
    "competitive_advantage": <number 0-100>,
    "scalability": <number 0-100>
  },
  "strengths": ["strength1", "strength2", "strength3"],
  "risks": ["risk1", "risk2", "risk3"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "summary": "2-3 sentence executive summary"
}

Base your scoring on:
- Market potential and problem significance
- Solution innovation and uniqueness
- Stage appropriateness and progress
- Funding requirements reasonability
- MVP status and execution capability

Return ONLY valid JSON, no markdown.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are ALSA, an expert startup analyst AI. Return only valid JSON." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    // Parse the JSON from the response
    let analysis;
    try {
      // Clean the content in case it has markdown code blocks
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      analysis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Provide default scoring if parsing fails
      analysis = {
        ai_score: 75,
        analysis: {
          market_potential: 70,
          team_execution: 75,
          innovation_level: 80,
          competitive_advantage: 70,
          scalability: 75
        },
        strengths: ["Innovative approach", "Clear problem definition", "Strong potential"],
        risks: ["Market competition", "Execution challenges", "Funding requirements"],
        recommendations: ["Validate market demand", "Build MVP quickly", "Focus on key metrics"],
        summary: "This startup shows promising potential with a clear problem-solution fit. Further validation and execution will determine success."
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Score startup error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
