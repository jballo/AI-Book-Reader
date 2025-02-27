"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";

export interface AudioProps {
    convertTextToSpeech: (
        text: string
    ) => Promise<{
        audioUrl: string;
        success: boolean;
        error?: string;
    }>;
}

interface AudioPlayerComponentProps {
    text: string;
    convertTextToSpeech: AudioProps["convertTextToSpeech"];
}

export default function AudioPlayer({ text, convertTextToSpeech }: AudioPlayerComponentProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Cleanup function for audio element
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
            }
        };
    }, []);

    const playTextAudio = async () => {
        if (!text || isLoading) return;
        
        setIsLoading(true);
        setError(null);
        setProgress(0);
        
        try {
            const result = await convertTextToSpeech(text);
            
            if (!result.success || !result.audioUrl) {
                throw new Error(result.error || 'Failed to get audio');
            }
            
            // Create or reset audio element
            if (!audioRef.current) {
                audioRef.current = new Audio();
            } else {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            
            // Set up event listeners for better UX
            audioRef.current.oncanplay = () => {
                console.log("Audio can play now");
                setIsLoading(false);
                audioRef.current?.play().catch(e => {
                    console.error("Play error:", e);
                    setError("Failed to play audio");
                    setIsPlaying(false);
                });
            };
            
            audioRef.current.onplay = () => {
                console.log("Audio started playing");
                setIsPlaying(true);
            };
            
            audioRef.current.onended = () => {
                console.log("Audio playback ended");
                setIsPlaying(false);
                setProgress(0);
            };
            
            audioRef.current.onerror = (e) => {
                console.error("Audio error:", e);
                setIsPlaying(false);
                setError("Audio playback error");
            };
            
            // Track progress
            audioRef.current.ontimeupdate = () => {
                if (audioRef.current) {
                    const percentage = (audioRef.current.currentTime / audioRef.current.duration) * 100;
                    setProgress(percentage);
                }
            };
            
            // Load the audio URL
            console.log("Setting audio source...");
            audioRef.current.src = result.audioUrl;
            audioRef.current.load();
            
        } catch (error) {
            console.error("Error playing audio:", error);
            setError(error instanceof Error ? error.message : 'Unknown error');
            setIsLoading(false);
        }
    };
    
    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
            setProgress(0);
        }
    };

    return (
        <div className="flex flex-col gap-2 mt-3">
            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}
            
            {/* Progress bar */}
            {(isPlaying || isLoading) && (
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                    <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            )}
            
            <div className="flex items-center gap-2">
                {isPlaying ? (
                    <Button 
                        onClick={stopAudio}
                        variant="destructive"
                        size="sm"
                    >
                        Stop Audio
                    </Button>
                ) : (
                    <Button 
                        onClick={playTextAudio}
                        variant="default"
                        disabled={isLoading || !text}
                        size="sm"
                        className="flex items-center"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                Loading...
                            </>
                        ) : "Read Aloud"}
                    </Button>
                )}
            </div>
        </div>
    );
}