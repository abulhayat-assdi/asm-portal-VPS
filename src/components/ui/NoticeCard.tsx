import Card, { CardBody } from "./Card";
import { Notice } from "@/services/dashboardService";

interface NoticeCardProps {
    notice: Notice;
    onEdit?: (notice: Notice) => void;
    onDelete?: (notice: Notice) => void;
}

// Format date to readable format
const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    } catch {
        return dateString;
    }
};

export default function NoticeCard({ notice, onEdit, onDelete }: NoticeCardProps) {
    const priority = notice.priority?.toLowerCase();
    const isUrgent = priority === "urgent";

    return (
        <Card hover className="h-full min-h-[200px] transition-all duration-300 hover:shadow-lg relative">
            <CardBody className="p-6 flex flex-col h-full">
                {/* Edit/Delete Buttons - Top Right Corner */}
                {(onEdit || onDelete) && (
                    <div className="absolute top-3 right-3 flex gap-1">
                        {onEdit && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(notice); }}
                                className="p-2 text-gray-400 hover:text-[#059669] hover:bg-gray-100 rounded-lg transition-colors"
                                title="Edit Notice"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(notice); }}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Notice"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                    </div>
                )}

                <div className="flex items-start justify-between mb-4 pr-16">
                    <h3 className="text-xl font-bold text-[#1f2937] flex-1 pr-4 leading-tight">
                        {notice.title}
                    </h3>
                    {/* Only show badge if Urgent */}
                    {isUrgent && (
                        <div className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-red-500 text-white shadow-md flex-shrink-0">
                            URGENT
                        </div>
                    )}
                </div>

                <p className="text-[#4b5563] text-base mb-6 line-clamp-3 flex-grow leading-relaxed">
                    {notice.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                    <div className="flex items-center gap-2 text-sm font-medium text-[#6b7280]">
                        <span className="text-lg">📅</span>
                        {formatDate(notice.date)}
                    </div>
                    {notice.createdByName && (
                        <div className="text-xs text-[#9ca3af] font-medium">
                            Posted by {notice.createdByName.split(' ')[0]}
                        </div>
                    )}
                </div>
            </CardBody>
        </Card>
    );
}
