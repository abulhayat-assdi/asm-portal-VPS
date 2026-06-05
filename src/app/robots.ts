import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/dashboard/",
                    "/student-dashboard/",
                    "/login",
                    "/student-login",
                    "/reset-password",
                    "/api/",
                    "/admin/",
                ],
            },
        ],
        sitemap: "https://tasm-skill.asf.bd/sitemap.xml",
    };
}
