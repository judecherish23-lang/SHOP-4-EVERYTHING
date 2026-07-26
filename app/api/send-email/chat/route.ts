import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, storeName } = await req.json();

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Add a system prompt to give Darling Chatbot her personality
    const systemPrompt = {
      role: 'system',
      content: `You are 'Darling Chatbot', the friendly, helpful shopping assistant for the online store '${storeName}'. Keep your answers short, upbeat, helpful, and use emojis. Do not invent products.`
    };

    // Call Groq's super-fast LPU endpoint using Llama 3.3 70B
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [systemPrompt, ...messages],
        max_tokens: 512
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || 'Error from Groq' }, { status: response.status });
    }

    return NextResponse.json({ reply: data.choices[0].message.content });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch AI response' }, { status: 500 });
  }
}