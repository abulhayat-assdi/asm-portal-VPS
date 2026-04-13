"use client";

import { useState, useEffect } from "react";
import Card, { CardBody } from "@/components/ui/Card";
import * as ssService from "@/services/successStoryService";
import Image from "next/image";
import Link from "next/link";

// ─── Video Card ───
function VideoCard({ story, onPlay }: { story: ssService.VideoStory; onPlay: (id: string) => void }) {
    const [imgError, setImgError] = useState(false);
    const thumbUrl = `https://img.youtube.com/vi/${story.videoId}/hqdefault.jpg`;

    return (
        <div className="flex flex-col group cursor-pointer w-full">
            <div
                className="relative rounded-2xl overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-400 aspect-video bg-[#0f1923]"
                onClick={() => onPlay(story.videoId)}
            >
                {!imgError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <Image
                        src={thumbUrl}
                        alt={story.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                        onError={() => setImgError(true)}
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0d2137] via-[#0a3020] to-[#0f1923]" />
                )}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                <span className="absolute top-4 left-4 bg-[#059669] text-white text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full shadow-lg">
                    {story.label}
                </span>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/60 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-white/30 shadow-2xl">
                        <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="flex gap-3 mt-4 px-1" onClick={() => onPlay(story.videoId)}>
                {story.studentName && (
                    <div className="flex-shrink-0 mt-1">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#059669] to-teal-400 flex items-center justify-center shadow-md text-white">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>
                    </div>
                )}
                <div className="flex flex-col">
                    <h3 className="text-gray-900 font-bold text-base md:text-lg leading-snug mb-1 line-clamp-2 group-hover:text-[#059669] transition-colors">
                        {story.title}
                    </h3>
                    {story.studentName && (
                        <div className="flex flex-col text-gray-500 text-sm">
                            <span className="font-semibold text-gray-700">{story.studentName}</span>
                            {story.batch && <span className="text-xs mt-0.5">{story.batch}</span>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Video Modal ───
function VideoModal({ videoId, onClose }: { videoId: string; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-white/20 flex items-center justify-center transition-colors duration-200"
                >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <div className="aspect-video">
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                        className="w-full h-full"
                        allow="autoplay; encrypted-media; fullscreen"
                        allowFullScreen
                        title="Success Story Video"
                    />
                </div>
            </div>
        </div>
    );
}

export default function SuccessStoriesContent() {
    const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
    const [videos, setVideos] = useState<ssService.VideoStory[]>([]);
    const [reviews, setReviews] = useState<ssService.WrittenReview[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [v, r] = await Promise.all([ssService.getVideos(), ssService.getReviews()]);
                setVideos(v);
                setReviews(r);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    if (loading) {
        return <div className="py-20 text-center text-gray-400">Loading stories...</div>;
    }

    return (
        <>
            {/* Video Gallery */}
            {videos.length > 0 && (
                <section className="w-full py-[15px]">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                            {videos.map((story) => (
                                <VideoCard key={story.id} story={story} onPlay={(id) => setActiveVideoId(id)} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Written Reviews */}
            {reviews.length > 0 && (
                <section className={`w-full py-16 md:py-20 ${videos.length > 0 ? "bg-white border-t border-gray-100" : ""}`}>
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-12">
                            <h2 className="text-2xl md:text-3xl font-bold text-[#1f2937] mb-4">
                                What Our Students Say
                            </h2>
                            <p className="text-[#6b7280] leading-relaxed">
                                Real feedback from our alumni who completed the program.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {reviews.map((review) => (
                                <Card key={review.id} hover className="h-full border-0 shadow-md hover:shadow-xl transition-all duration-300">
                                    <CardBody className="flex flex-col h-full p-8">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center flex-shrink-0 border-2 border-emerald-100">
                                                <svg className="w-6 h-6 text-[#059669]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                    <circle cx="12" cy="7" r="4" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{review.studentName}</h3>
                                                <p className="text-[#059669] text-sm font-medium">{review.role}</p>
                                                <p className="text-gray-500 text-xs">{review.company}</p>
                                            </div>
                                        </div>

                                        <div className="mb-6 relative flex-1">
                                            <svg className="absolute -top-4 -left-2 w-8 h-8 text-[#d1fae5] transform -scale-x-100" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M14.017 21L14.017 18C14.017 16.896 14.321 16.068 14.93 15.516C15.539 14.964 16.29 14.326 17.183 13.602C18.076 12.879 18.522 12.189 18.522 11.532C18.522 10.875 18.006 10.323 16.974 9.876V8.16599C18.887 8.35199 20.354 8.78399 21.375 9.46199C22.396 10.14 22.906 11.332 22.906 13.038C22.906 15.657 21.677 18.311 19.22 21H14.017ZM8.61003 21H3.40703L3.40703 18C3.40703 16.896 3.71103 16.068 4.31903 15.516C4.92703 14.964 5.67903 14.326 6.57403 13.602C7.46903 12.879 7.91503 12.189 7.91503 11.532C7.91503 10.875 7.4 10.323 6.37003 9.876V8.16599C8.28103 8.35199 9.74803 8.78399 10.771 9.46199C11.794 10.14 12.305 11.332 12.305 13.038C12.305 15.657 11.077 18.311 8.61003 21Z" />
                                            </svg>
                                            <p className="text-gray-600 italic leading-relaxed relative z-10 pl-2">
                                                &quot;{review.quote}&quot;
                                            </p>
                                        </div>

                                        <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50 -mx-8 -mb-8 px-8 py-4">
                                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                {review.batch}
                                            </span>
                                            <div className="flex text-[#fbbf24]">
                                                {[...Array(Number(review.rating) || 5)].map((_, i) => (
                                                    <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                ))}
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Empty state */}
            {videos.length === 0 && reviews.length === 0 && (
                <div className="py-20 text-center text-gray-400">
                    <p className="text-lg">No success stories published yet.</p>
                    <p className="text-sm mt-2">Check back soon!</p>
                </div>
            )}

            {/* CTA */}
            {(videos.length > 0 || reviews.length > 0) && (
                <section className="w-full py-[15px]">
                    <div className="text-center">
                        <Link
                            href="/enroll"
                            prefetch={true}
                            className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-[#059669] border border-transparent rounded-full hover:bg-[#047857] hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200"
                        >
                            Start Your Success Story Today
                            <svg className="w-5 h-5 ml-2 -mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </Link>
                    </div>
                </section>
            )}

            {activeVideoId && (
                <VideoModal videoId={activeVideoId} onClose={() => setActiveVideoId(null)} />
            )}
        </>
    );
}
