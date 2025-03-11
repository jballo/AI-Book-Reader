"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import ReactAudioPlayer from 'react-audio-player';

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
    const [isLoading, setIsLoading] = useState(false);
    const [src, setSrc] = useState<string>('');
    
    const playTextAudio = async () => {
        if (!text || isLoading) return;
        
        try {
            setIsLoading(true);
            
            const result = await convertTextToSpeech(text);
            
            if (!result.success || !result.audioUrl) {
                throw new Error(result.error || 'Failed to get audio');
            }
            setSrc(result.audioUrl);
            setIsLoading(false);
        } catch (error) {
            console.error("Error:", error);
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-2 mt-3">
            
            <div className="flex items-center gap-2">
                    <Button 
                        onClick={()=>{
                            playTextAudio();
                        }}
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
            </div>
            {src && (
                <ReactAudioPlayer
                    src={src}
                    autoPlay
                    controls
                />
            )}
        </div>
    );
}