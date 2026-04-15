import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const { adminAuth, adminDb } = getAdminServices();

    // 1. Get Token from Cookie or Authorization Header
    let token = req.cookies.get('__session')?.value;
    const authHeader = req.headers.get('Authorization');
    
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.split('Bearer ')[1];
    }

    if (!token) {
      return NextResponse.json({ error: "Forbidden: Missing authentication token" }, { status: 403 });
    }

    // 2. Verify Token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (authError: any) {
      return NextResponse.json({ error: "Forbidden: Invalid session" }, { status: 403 });
    }

    // 3. Admin Check
    const callerDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { pageId, content } = await req.json();

    if (!pageId || !content) {
      return NextResponse.json({ error: "Missing required fields (pageId, content)" }, { status: 400 });
    }

    // 4. Update the Firestore document
    await adminDb.collection('public_pages').doc(pageId).set(content, { merge: true });

    // 5. On-demand Revalidation (Cache Busting)
    try {
      if (pageId === 'home_page') revalidatePath('/');
      else if (pageId === 'about_page') revalidatePath('/about');
      else if (pageId === 'modules_page') revalidatePath('/modules');
      else if (pageId === 'instructors_page') revalidatePath('/instructors');
      else if (pageId === 'success_stories_page') revalidatePath('/success-stories');
      else if (pageId === 'contact_page') revalidatePath('/contact');
      else if (pageId === 'blog_page') revalidatePath('/blog');
      
      // Also revalidate the main layout to be safe
      revalidatePath('/', 'layout');
    } catch (revalidateError) {
      console.error("Revalidation failed:", revalidateError);
      // We don't fail the request if revalidation fails
    }

    return NextResponse.json({ success: true, message: "Page content updated successfully and cache purged." });
  } catch (error) {
    console.error("Error updating CMS content:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update page content.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
