"use client";

import React, { useState, useEffect } from "react";
import { getVideos, HomeVideoTestimonial } from "@/services/homeVideoTestimonialService";

export default function StudentVideoTestimonials() {
    const [videos, setVideos] = useState<HomeVideoTestimonial[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [activeIndex, setActiveIndex] = useState(0);
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const data = await getVideos();
                setVideos(data);
            } catch (err) {
                console.error("Failed to load videos", err);
            } finally {
                setLoading(false);
            }
        };
        fetchVideos();
    }, []);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (!videos || videos.length === 0) return;
        if (selectedVideo !== null) return; // Pause auto-play when modal is open
        if (isHovered) return; // Pause when hovering

        const interval = setInterval(() => {
            setActiveIndex((current) => (current + 1) % videos.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [videos.length, selectedVideo, isHovered]);

    const handleNext = () => {
        setActiveIndex((current) => (current + 1) % videos.length);
    };

    const handlePrev = () => {
        setActiveIndex((current) => (current - 1 + videos.length) % videos.length);
    };

    if (loading) {
        return (
            <div className="py-24 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
            </div>
        );
    }

    if (!videos || videos.length === 0) return null;

    // Scale up the video sizes
    const slideWidth = isMobile ? 85 : 60; // 60% on desktop, 85% on mobile to show adjacent peeks
    const offset = activeIndex * slideWidth;
    const centerMargin = videos.length === 1 ? 0 : (100 - slideWidth) / 2;

    return (
        <section className="bg-gray-50 overflow-hidden relative py-[15px]">
            <div className="container mx-auto px-4 md:px-8">
                <div className="text-center mb-10 flex flex-col items-center">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-100/50 border border-emerald-200 text-emerald-800 text-sm font-semibold mb-3 tracking-wide uppercase">
                        Inspiring Stories
                    </div>
                    <h2 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#0f172a] to-[#059669] mb-4 tracking-tight leading-tight max-w-4xl pb-1">
                        What Our Students Say About Us
                    </h2>
                    <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                        Hear from the people who have transformed their lives and careers through our practical approach.
                    </p>
                </div>

                <div 
                    className="relative w-full max-w-[1400px] mx-auto"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {/* Navigation Buttons */}
                    <button 
                        onClick={handlePrev}
                        className="absolute left-2 md:-left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-2xl text-blue-900 hover:bg-blue-900 hover:text-white transition-all duration-300 pointer-events-auto hover:scale-110"
                        aria-label="Previous video"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    
                    <button 
                        onClick={handleNext}
                        className="absolute right-2 md:-right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-2xl text-blue-900 hover:bg-blue-900 hover:text-white transition-all duration-300 pointer-events-auto hover:scale-110"
                        aria-label="Next video"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    {/* Carousel Viewport */}
                    <div className="overflow-visible relative">
                        <div 
                            className={`flex transition-transform duration-700 ease-in-out ${videos.length === 1 ? 'justify-center' : ''}`}
                            style={{ 
                                width: '100%',
                                transform: videos.length === 1 ? 'none' : `translateX(-${offset}%)`,
                                marginLeft: `${centerMargin}%`
                            }}
                        >
                            {videos.map((video, index) => {
                                const isActive = index === activeIndex;
                                
                                return (
                                    <div 
                                        key={video.id}
                                        className="flex-shrink-0 transition-all duration-700 ease-in-out px-2 md:px-6 py-8"
                                        style={{ width: `${slideWidth}%` }}
                                    >
                                        <div 
                                            className={`relative w-full aspect-video rounded-3xl overflow-hidden cursor-pointer group shadow-2xl transition-all duration-700 transform ${isActive ? 'scale-100 opacity-100 shadow-blue-900/20 ring-4 ring-blue-500/30 ring-offset-4' : 'scale-90 opacity-40 grayscale-[30%] blur-[2px]'}`}
                                            onClick={() => setSelectedVideo(video.videoId)}
                                        >
                                            {/* Thumbnail Background */}
                                            <div 
                                                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                                                style={{ backgroundImage: `url(https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg)` }}
                                            />
                                            {/* Gradients */}
                                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />

                                            {/* Play Button Icon */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-md flex items-center justify-center rounded-full shadow-2xl group-hover:bg-white/40 transition-all duration-300 group-hover:scale-110 text-white">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Video Details below thumbnail (YouTube style) */}
                                        <div 
                                            className={`mt-4 px-2 md:px-4 flex gap-3 transition-opacity duration-700 ${isActive ? 'opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none'}`}
                                            onClick={() => isActive && setSelectedVideo(video.videoId)}
                                        >
                                            {/* Avatar */}
                                            {video.studentName && (
                                                <div className="flex-shrink-0 mt-1">
                                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#059669] to-teal-400 flex items-center justify-center shadow-md text-white">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                            <circle cx="12" cy="7" r="4" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Title & Student Info */}
                                            <div className="flex flex-col text-left">
                                                <h3 className="text-gray-900 font-bold text-lg md:text-xl line-clamp-2 leading-snug hover:text-[#059669] transition-colors">
                                                    {video.title}
                                                </h3>
                                                {video.studentName && (
                                                    <div className="flex flex-col mt-1 text-gray-500 text-sm md:text-base">
                                                        <span className="font-semibold text-gray-700">{video.studentName}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Video Modal Player */}
            {selectedVideo && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-500">
                    <div 
                        className="absolute inset-0 bg-black/50 backdrop-blur-xl cursor-pointer"
                        onClick={() => setSelectedVideo(null)}
                    />
                    
                    <button 
                        className="absolute top-4 right-4 md:top-8 md:right-8 text-white/80 hover:text-white transition-all z-50 p-3 bg-black/20 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/20 transform hover:scale-110 shadow-2xl"
                        onClick={() => setSelectedVideo(null)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="relative w-full max-w-[95vw] md:max-w-[85vw] xl:max-w-7xl aspect-video bg-black rounded-2xl md:rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] z-10 animate-in zoom-in-75 duration-500">
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1&rel=0`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="w-full h-full object-cover"
                        ></iframe>
                    </div>
                </div>
            )}
        </section>
    );
}
