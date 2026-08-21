import { createClient } from "@/utils/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  console.log("Auth callback hit", request.url);
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    console.log("Code present:", code);
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      console.log("No error, redirecting to", next);
      return NextResponse.redirect(new URL(next, request.url));
    } else {
      console.log("Error:", error);
    }
  } else {
    console.log("No code in params");
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(new URL("/error", request.url));
}
