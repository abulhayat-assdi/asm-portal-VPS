import Card, { CardBody } from "./Card";
import Badge from "./Badge";
import { Resource } from "@/services/resourceService";
import { formatDateShort } from "@/lib/utils";

interface ResourceCardProps {
    resource: Resource;
}

export default function ResourceCard({ resource }: ResourceCardProps) {
    const getCategoryIcon = (category: string) => {
        switch (category) {
            case "Course Module":
                return "📚";
            case "Class Routine":
                return "🗓️";
            case "Notes":
                return "📝";
            case "Assignment":
                return "📋";
            case "Exam / Practice":
                return "🎓";
            default:
                return "📁";
        }
    };

    const getCategoryVariant = (category: string): "success" | "info" | "warning" => {
        switch (category) {
            case "Course Module":
                return "success";
            case "Class Routine":
                return "info";
            case "Notes":
                return "info";
            case "Assignment":
                return "warning";
            case "Exam / Practice":
                return "warning";
            default:
                return "info";
        }
    };

    return (
        <Card hover className="h-full">
            <CardBody>
                <div className="flex items-start gap-3 mb-3">
                    <div className="text-3xl">{getCategoryIcon(resource.category)}</div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {resource.title}
                        </h3>
                        <Badge variant={getCategoryVariant(resource.category)} size="sm">
                            {resource.category}
                        </Badge>
                    </div>
                </div>

                {resource.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {resource.description}
                    </p>
                )}

                <div className="space-y-2 mb-4">
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                        👤 Uploaded by: {resource.uploadedByName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                        📅 Date: {formatDateShort(resource.uploadDate)}
                    </p>
                </div>

                <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white text-sm font-semibold rounded-lg transition-colors"
                >
                    View / Download
                </a>
            </CardBody>
        </Card>
    );
}
