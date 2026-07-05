import { ENV } from "@/config/environment";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

// bila dibutuhkan auth system maka perlu proxy.ts

export const supabaseProxy = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(ENV.supabaseUrl!, ENV.supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  //   Kalo sudah ada auth system baru ini diaktifin
  if (!user && !request.nextUrl.pathname.startsWith("/login")) {
    // const url = request.nextUrl.clone();
    // url.pathname = '/login';
    // return NextResponse.redirect(url);
  }

  return supabaseResponse;
};
