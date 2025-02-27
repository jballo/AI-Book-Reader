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
    
    // Set up audio element once
    useEffect(() => {
        const audio = new Audio();
        audio.volume = 1.0;
        
        audio.addEventListener('play', () => setIsPlaying(true));
        audio.addEventListener('pause', () => setIsPlaying(false));
        audio.addEventListener('ended', () => {
            setIsPlaying(false);
            setProgress(0);
        });
        audio.addEventListener('timeupdate', () => {
            if (audio.duration) {
                const percentage = (audio.currentTime / audio.duration) * 100;
                setProgress(percentage);
            }
        });
        
        audioRef.current = audio;
        
        return () => {
            audio.pause();
            audio.src = '';
        };
    }, []);
    
    const playTextAudio = async () => {
        if (!text || isLoading) return;
        
        try {
            setIsLoading(true);
            setError(null);
            
            const result = await convertTextToSpeech(text);
            
            if (!result.success || !result.audioUrl) {
                throw new Error(result.error || 'Failed to get audio');
            }
            
            if (audioRef.current) {
                const audio = audioRef.current;
                
                // Set up a one-time event for when audio is ready
                const canPlayHandler = () => {
                    console.log("Audio can play now");
                    audio.play()
                        .then(() => {
                            console.log("Audio started playing");
                            setIsLoading(false);
                        })
                        .catch((e) => {
                            console.error("Play error:", e);
                            setError("Failed to play audio. Click play again.");
                            setIsLoading(false);
                        });
                };
                
                // Set up the event listener for one time use
                audio.addEventListener('canplaythrough', canPlayHandler, { once: true });
                
                // Also add an error handler
                const errorHandler = () => {
                    console.error("Audio load error");
                    setError("Failed to load audio");
                    setIsLoading(false);
                };
                audio.addEventListener('error', errorHandler, { once: true });
                
                // Set the source and start loading
                audio.src = result.audioUrl;
                audio.load();
                
                // Clean up if component unmounts during loading
                return () => {
                    audio.removeEventListener('canplaythrough', canPlayHandler);
                    audio.removeEventListener('error', errorHandler);
                };
            }
        } catch (error) {
            console.error("Error:", error);
            setError(error instanceof Error ? error.message : 'Unknown error');
            setIsLoading(false);
        }
    };
    
    const stopAudio = () => {
        if (audioRef.current) {
            const audio = audioRef.current;
            audio.pause();
            audio.currentTime = 0;
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
                        disabled={isLoading || !text}
                        size="sm"
                        className="flex items-center bg-[#C1FF7A] text-black hover:bg-[#a8e663]"
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