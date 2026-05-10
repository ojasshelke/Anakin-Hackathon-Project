import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from('bookings')
    .select('slot_date, slot_time')
    .not('slot_date', 'is', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const slots = data.map(b => ({ date: b.slot_date, time: b.slot_time }));
  return NextResponse.json({ slots });
}

export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY || '');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
    const formattedKey = rawKey.replace(/\\n/g, '\n').replace(/^["']|["']$/g, '');
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: formattedKey,
      scopes: ['https://www.googleapis.com/auth/calendar.events'],
    });
    const calendar = google.calendar({ version: 'v3', auth });

    const body = await req.json();
    const { name, email, company, slotDate, slotTime, platform, message, companySize } = body;

    if (!name || !email || !company) {
      return NextResponse.json({ error: 'Required fields missing.' }, { status: 400 });
    }

    // 1. Insert into Supabase
    const { data: booking, error: dbError } = await supabase
      .from('bookings')
      .insert([
        {
          name,
          email,
          company,
          platform: platform || '',
          message: message || '',
          slot_date: slotDate || null,
          slot_time: slotTime || null,
          company_size: companySize || '',
        }
      ])
      .select()
      .single();

    if (dbError) throw dbError;

    // 2. Automate Calendar & Email
    let meetLink = 'https://meet.google.com/zwt-jxqe-zpo'; // Static link from your friend
    
    if (slotDate && slotTime) {
      try {
        // Parse time for Google Calendar
        const [timeMatch, period] = slotTime.split(' ');
        let [hours, minutes] = timeMatch.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        const startDate = new Date(`${slotDate}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00+05:30`);
        const endDate = new Date(startDate.getTime() + 30 * 60000);

        // Insert Google Calendar Event
        await calendar.events.insert({
          calendarId: process.env.GOOGLE_CALENDAR_ID,
          requestBody: {
            summary: `Vexa Demo: ${company}`,
            description: `Name: ${name}\nEmail: ${email}\nPlatform: ${platform}\nMessage: ${message}\n\nMeet Link: ${meetLink}`,
            start: { dateTime: startDate.toISOString() },
            end: { dateTime: endDate.toISOString() },
            location: meetLink
          }
        });

        // Send Professional "Rocket AI" Confirmation Email
        await resend.emails.send({
          from: 'Vexa Team <buisness@vexatryon.in>',
          to: email,
          subject: `Demo Confirmed: ${company} x VEXA`,
          html: `
            <div style="font-family: sans-serif; background-color: #fdfdfc; padding: 40px;">
              <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; border: 1px solid #f1f1f1; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
                <div style="background: #4A6741; padding: 40px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">Demo Confirmed!</h1>
                </div>
                <div style="padding: 40px;">
                  <p style="color: #666; font-size: 16px;">Hi ${name},</p>
                  <p style="color: #666; font-size: 16px;">We've scheduled your VEXA AI demo session.</p>
                  <div style="background: #f9f9f9; padding: 24px; border-radius: 16px; margin: 24px 0;">
                    <p style="margin: 0; font-weight: bold; color: #1a1a1a;">Date: ${slotDate}</p>
                    <p style="margin: 8px 0; font-weight: bold; color: #1a1a1a;">Time: ${slotTime} (IST)</p>
                    <a href="${meetLink}" style="color: #4A6741; text-decoration: none; font-weight: bold;">Join Google Meet →</a>
                  </div>
                  <p style="color: #999; font-size: 12px;">© 2026 Vexa Solutions. Rocket AI Designed.</p>
                </div>
              </div>
            </div>
          `
        });
      } catch (automationError) {
        console.error('Automation Error:', automationError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
