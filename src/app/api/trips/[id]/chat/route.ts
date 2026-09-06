// ============================================================================
// API Route: POST /api/trips/[id]/chat
// Specification Sections 27, 28, 29, 55, 56:
// - Personalized Real-Time Trip Chat Assistant
// - Compact TripContext provided to Gemini (not the whole database)
// - Controlled Actions Registry:
//   MOVE_ACTIVITY | ADD_ACTIVITY | REMOVE_ACTIVITY | CHANGE_BUDGET | CREATE_TODO | CREATE_POLL
// - Strict state tracking: PROPOSED -> CONFIRMED -> EXECUTED -> FAILED
// - Safety guardrail: AI proposes actions instead of blindly mutating data
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { GeminiMultimodalService } from '@/lib/video-pipeline/geminiMultimodalService';
import { ControlledActionProposal } from '@/lib/types/travelVideoPipeline';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const tripId = resolvedParams.id;

  try {
    const body = await req.json();
    const { message, tripContext, chatHistory } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message text is required.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const model = GeminiMultimodalService.getTextModel();

    // Default response in case of API failure
    let replyText = `I analyzed your trip to ${tripContext?.destination || 'your destination'}. How would you like to customize the schedule?`;
    let actionProposal: ControlledActionProposal | null = null;

    if (apiKey && !apiKey.includes('your-gemini')) {
      const systemPrompt = `You are Ghoomo AI Trip Assistant. You have access to the current collaborative trip context.
Never claim you mutated or booked anything directly. If the user asks for a change, PROPOSE a controlled action.

CURRENT TRIP CONTEXT:
${JSON.stringify(tripContext || {}, null, 2)}

CONTROLLED ACTIONS REGISTRY:
1. MOVE_ACTIVITY: { placeName: string, fromDay: number, toDay: number }
2. ADD_ACTIVITY: { placeName: string, day: number, timeSlot: 'morning' | 'afternoon' | 'evening' }
3. REMOVE_ACTIVITY: { placeName: string }
4. CHANGE_BUDGET: { newBudgetTotal: number, reason: string }
5. CREATE_TODO: { title: string, category: 'booking' | 'packing' | 'documents' | 'gear' }
6. CREATE_POLL: { title: string, options: string[] }

Respond ONLY with valid JSON in this schema:
{
  "reply": "Friendly, direct natural language answer explaining your reasoning",
  "actionProposal": {
    "action_type": "MOVE_ACTIVITY | ADD_ACTIVITY | REMOVE_ACTIVITY | CHANGE_BUDGET | CREATE_TODO | CREATE_POLL | null",
    "description": "Short human-readable summary of proposed change",
    "parameters": { ... }
  } or null
}`;

      try {
        const rawJson = await GeminiMultimodalService.callGeminiWithRetry(
          model,
          [
            { parts: [{ text: systemPrompt }] },
            { parts: [{ text: `User: "${message}"` }] },
          ],
          apiKey
        );

        const parsed = JSON.parse(rawJson);
        if (parsed.reply) {
          replyText = parsed.reply;
        }
        if (parsed.actionProposal && parsed.actionProposal.action_type) {
          actionProposal = {
            id: `act-${Date.now()}`,
            action_type: parsed.actionProposal.action_type,
            description: parsed.actionProposal.description || 'Proposed schedule modification',
            parameters: parsed.actionProposal.parameters || {},
            status: 'PROPOSED',
            created_at: new Date().toISOString(),
          };
        }
      } catch (aiErr) {
        console.warn('[TripChatAPI] Gemini chat notice:', (aiErr as Error).message);
      }
    } else {
      // Deterministic rule-based assistant fallback
      const lower = message.toLowerCase();
      if (lower.includes('budget') || lower.includes('cost') || lower.includes('spend')) {
        replyText = `Your current estimated budget for ${tripContext?.destination || 'this trip'} is ₹${(tripContext?.budget || 45000).toLocaleString('en-IN')}. Would you like to adjust the hotel tier or transport style?`;
      } else if (lower.includes('beach') || lower.includes('relax')) {
        replyText = `Day 2 or Day 3 currently has the most flexible afternoon window. I can propose moving an activity to free up beach time!`;
        actionProposal = {
          id: `act-${Date.now()}`,
          action_type: 'MOVE_ACTIVITY',
          description: 'Shift afternoon activity to Day 4 to create a beach relaxation window',
          parameters: { targetDay: 4, reason: 'Beach afternoon' },
          status: 'PROPOSED',
          created_at: new Date().toISOString(),
        };
      } else if (lower.includes('poll') || lower.includes('vote')) {
        actionProposal = {
          id: `act-${Date.now()}`,
          action_type: 'CREATE_POLL',
          description: 'Create a group poll for restaurant / stay preference',
          parameters: { title: 'Where should we eat on Day 2?', options: ['Beachside Cafe', 'Traditional Market', 'Rooftop Lounge'] },
          status: 'PROPOSED',
          created_at: new Date().toISOString(),
        };
        replyText = 'I prepared a poll for your group. Review the options below to post it!';
      }
    }

    return NextResponse.json({
      success: true,
      trip_id: tripId,
      reply: replyText,
      actionProposal,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Chat assistant encountered an error.' },
      { status: 500 }
    );
  }
}
