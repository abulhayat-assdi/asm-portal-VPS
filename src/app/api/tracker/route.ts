import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const sessionCookie = request.cookies.get('__session')?.value;
    if (!sessionCookie) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { adminAuth } = getAdminServices();
    await adminAuth.verifyIdToken(sessionCookie);

    const data = await request.json();
    const googleScriptUrl = "https://script.google.com/macros/s/AKfycbzBSz_U3ej-fVaWLK5aJj8mw88cBxk1Vohx_1v8anE-YGjwyNT8xGbkhN7xhCBCoK-D/exec";

    const response = await fetch(googleScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Important: Google Apps Script expects stringified JSON in the body
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Proxy API Error" },
      { status: 500 }
    );
  }
}
