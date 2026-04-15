import { doc, getDoc, setDoc, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  defaultHomePageContent, 
  defaultAboutPageContent, 
  defaultModulesPageContent, 
  defaultSuccessStoriesPageContent, 
  defaultContactPageContent, 
  defaultBlogPageContent,
  defaultInstructorsPageContent
} from "@/lib/defaultCmsContent";

const PAGE_COLLECTION = "public_pages";

export const getPageContent = async (pageId: string) => {
  try {
    const docRef = doc(db, PAGE_COLLECTION, pageId);
    const docSnap = await getDoc(docRef);

    let defaultContent = {};
    switch (pageId) {
      case "home_page": defaultContent = defaultHomePageContent; break;
      case "about_page": defaultContent = defaultAboutPageContent; break;
      case "modules_page": defaultContent = defaultModulesPageContent; break;
      case "instructors_page": defaultContent = defaultInstructorsPageContent; break;
      case "success_stories_page": defaultContent = defaultSuccessStoriesPageContent; break;
      case "contact_page": defaultContent = defaultContactPageContent; break;
      case "blog_page": defaultContent = defaultBlogPageContent; break;
    }

    if (docSnap.exists()) {
      const data = docSnap.data() || {};
      const def = defaultContent as any;
      
      // Safe merge of sections
      return {
        ...def,
        ...data,
        // Deep merge for specific common sections to avoid nested undefined
        hero: { ...(def.hero || {}), ...(data.hero || {}) },
        header: { ...(def.header || {}), ...(data.header || {}) },
        targetAudience: { ...(def.targetAudience || {}), ...(data.targetAudience || {}) },
        learningOutcomes: { ...(def.learningOutcomes || {}), ...(data.learningOutcomes || {}) },
        socialHeader: { ...(def.socialHeader || {}), ...(data.socialHeader || {}) },
        aboutSection: { ...(def.aboutSection || {}), ...(data.aboutSection || {}) },
        whySection: { ...(def.whySection || {}), ...(data.whySection || {}) },
        ctaSection: { ...(def.ctaSection || {}), ...(data.ctaSection || {}) },
      };
    } else {
      return defaultContent;
    }
  } catch (error) {
    console.error(`Error fetching page content for ${pageId}:`, error);
    switch (pageId) {
      case "home_page": return defaultHomePageContent;
      case "about_page": return defaultAboutPageContent;
      case "modules_page": return defaultModulesPageContent;
      case "instructors_page": return defaultInstructorsPageContent;
      case "success_stories_page": return defaultSuccessStoriesPageContent;
      case "contact_page": return defaultContactPageContent;
      case "blog_page": return defaultBlogPageContent;
      default: return {};
    }
  }
};

export const updatePageContent = async (pageId: string, data: DocumentData) => {
  try {
    const docRef = doc(db, PAGE_COLLECTION, pageId);
    await setDoc(docRef, data, { merge: true });
    return { success: true };
  } catch (error) {
    console.error(`Error updating page content for ${pageId}:`, error);
    throw error;
  }
};
