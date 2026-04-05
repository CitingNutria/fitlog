import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: Request) {
	// Exchange the code in URL for a session, then redirect to home
	const url = new URL(request.url);
	const code = url.searchParams.get('code');
	if (supabase && code) {
		try {
			await supabase.auth.exchangeCodeForSession(code);
		} catch {
			// ignore; will fall back to home
		}
	}
	return NextResponse.redirect(new URL('/', request.url));
}

