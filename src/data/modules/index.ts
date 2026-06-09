import { salesMasteryData, CourseData } from './sales-mastery';
import { careerPlanningData } from './career-planning-branding';
import { customerServiceData } from './customer-service-excellence';
import { aiDigitalMarketersData } from './ai-digital-marketers';
import { digitalMarketingData } from './digital-marketing';
import { businessManagementToolsData } from './business-management-tools';
import { landingPageContentData } from './landing-page-content-marketing';
import { businessEnglishData } from './business-english';
import { dawahEthicsData } from './dawah-business-ethics';
import { artOfSalesMarketingData } from './art-of-sales-marketing';
import { codeFreeCommerceData } from './code-free-commerce';
import { dawahData } from './dawah';

export const modulesData: Record<string, CourseData> = {
  'sales-mastery': salesMasteryData,
  'career-planning-branding': careerPlanningData,
  'customer-service-excellence': customerServiceData,
  'ai-for-digital-marketers': aiDigitalMarketersData,
  'digital-marketing': digitalMarketingData,
  'business-management-tools': businessManagementToolsData,
  'landing-page-content-marketing': landingPageContentData,
  'content-video-sales-system': landingPageContentData,
  'business-english': businessEnglishData,
  'dawah-business-ethics': dawahEthicsData,
  'art-of-sales-marketing': artOfSalesMarketingData,
  'code-free-commerce': codeFreeCommerceData,
  'dawah': dawahData,
};

export const getModuleData = (slug: string): CourseData | null => {
  return modulesData[slug] || null;
};
