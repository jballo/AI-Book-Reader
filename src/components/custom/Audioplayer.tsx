"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Loader2, Pause, Play, RotateCcw, RotateCw } from "lucide-react";

export interface AudioProps {
    convertTextToSpeech: (
        text: string
    ) => Promise<{
        audioUrl: string;
        success: boolean;
        error?: string;
    }>;
}

export const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 2];
const SKIP_SECONDS = 10;
const AUDIO_ERROR_MESSAGE = "Couldn't read this page aloud. Try again.";

const ROUND_BUTTON =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";
const PILL_BUTTON =
    "flex h-11 items-center gap-2.5 rounded-full border border-border px-4 text-sm transition-colors hover:bg-secondary";

type AudioState =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "ready"; src: string }
    | { status: "error" };

interface AudioPlayerComponentProps {
    text: string;
    pageNumber: number;
    convertTextToSpeech: AudioProps["convertTextToSpeech"];
    playbackRate: number;
    onPlaybackRateChange: (rate: number) => void;
    autoTurn: boolean;
    onAutoTurnChange: (autoTurn: boolean) => void;
    autoStart: boolean;
    onEnded: () => void;
}

function formatTime(seconds: number) {
    const whole = Number.isFinite(seconds) ? Math.floor(seconds) : 0;
    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export default function AudioPlayer({
    text,
    pageNumber,
    convertTextToSpeech,
    playbackRate,
    onPlaybackRateChange,
    autoTurn,
    onAutoTurnChange,
    autoStart,
    onEnded,
}: AudioPlayerComponentProps) {
    const [audio, setAudio] = useState<AudioState>(() =>
        autoStart && text ? { status: "loading" } : { status: "idle" }
    );
    const [isPlaying, setIsPlaying] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);
    const hasAutoStartedRef = useRef(false);

    const fetchAudio = async () => {
        try {
            const result = await convertTextToSpeech(text);
            if (!result.success || !result.audioUrl) {
                throw new Error(result.error || "No audio returned");
            }
            setAudio({ status: "ready", src: result.audioUrl });
        } catch (error) {
            console.error("Error generating page audio:", error);
            setAudio({ status: "error" });
        }
    };

    const startAutoPlay = useEffectEvent(() => {
        void fetchAudio();
    });

    useEffect(() => {
        if (!autoStart || !text || hasAutoStartedRef.current) return;
        hasAutoStartedRef.current = true;
        startAutoPlay();
    }, [autoStart, text]);

    const requestAudio = () => {
        if (!text) return;
        setAudio({ status: "loading" });
        setElapsed(0);
        setDuration(0);
        void fetchAudio();
    };

    const togglePlayback = () => {
        if (audio.status !== "ready") {
            requestAudio();
            return;
        }
        const element = audioRef.current;
        if (!element) return;
        if (element.paused) {
            element.play().catch((error) => console.error("Playback failed:", error));
        } else {
            element.pause();
        }
    };

    const skip = (seconds: number) => {
        const element = audioRef.current;
        if (!element) return;
        element.currentTime = Math.min(Math.max(element.currentTime + seconds, 0), element.duration || 0);
    };

    const cycleSpeed = () => {
        const nextRate = PLAYBACK_SPEEDS[(PLAYBACK_SPEEDS.indexOf(playbackRate) + 1) % PLAYBACK_SPEEDS.length];
        onPlaybackRateChange(nextRate);
        if (audioRef.current) audioRef.current.playbackRate = nextRate;
    };

    const isReady = audio.status === "ready";
    const isLoading = audio.status === "loading";

    let statusMessage = "";
    if (!text) statusMessage = "There's no text on this page to read aloud.";
    else if (audio.status === "idle") statusMessage = `Press play to hear page ${pageNumber}.`;
    else if (isLoading) statusMessage = `Preparing the voice for page ${pageNumber}…`;
    else if (audio.status === "error") statusMessage = AUDIO_ERROR_MESSAGE;

    return (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {isReady && (
                <audio
                    ref={audioRef}
                    src={audio.src}
                    autoPlay
                    onLoadedMetadata={(event) => {
                        event.currentTarget.playbackRate = playbackRate;
                        setDuration(event.currentTarget.duration);
                    }}
                    onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => {
                        setIsPlaying(false);
                        onEnded();
                    }}
                />
            )}

            <div className="flex items-center gap-2.5">
                <button
                    type="button"
                    aria-label={`Back ${SKIP_SECONDS} seconds`}
                    className={ROUND_BUTTON}
                    disabled={!isReady}
                    onClick={() => skip(-SKIP_SECONDS)}
                >
                    <RotateCcw className="h-5 w-5" />
                </button>
                <button
                    type="button"
                    aria-label={isLoading ? "Preparing audio" : isPlaying ? "Pause" : "Play"}
                    className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-highlight text-highlight-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-secondary disabled:text-highlight"
                    disabled={!text || isLoading}
                    onClick={togglePlayback}
                >
                    {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : isPlaying ? (
                        <Pause className="h-5 w-5" fill="currentColor" />
                    ) : (
                        <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
                    )}
                </button>
                <button
                    type="button"
                    aria-label={`Forward ${SKIP_SECONDS} seconds`}
                    className={ROUND_BUTTON}
                    disabled={!isReady}
                    onClick={() => skip(SKIP_SECONDS)}
                >
                    <RotateCw className="h-5 w-5" />
                </button>
            </div>

            <div className="flex min-w-0 flex-[1_1_280px] items-center gap-3">
                {isReady ? (
                    <>
                        <span className="text-sm tabular-nums text-muted-foreground">{formatTime(elapsed)}</span>
                        <input
                            type="range"
                            aria-label="Seek"
                            min={0}
                            max={duration || 0}
                            step={0.1}
                            value={Math.min(elapsed, duration || 0)}
                            onChange={(event) => {
                                const time = Number(event.target.value);
                                if (audioRef.current) audioRef.current.currentTime = time;
                                setElapsed(time);
                            }}
                            className="h-1 min-w-0 flex-1 cursor-pointer accent-highlight"
                        />
                        <span className="text-sm tabular-nums text-muted-foreground">{formatTime(duration)}</span>
                    </>
                ) : (
                    <p
                        role={audio.status === "error" ? "alert" : undefined}
                        aria-live="polite"
                        className={`text-sm ${audio.status === "error" ? "text-red-300" : "text-muted-foreground"}`}
                    >
                        {statusMessage}
                    </p>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    aria-label={`Playback speed ${playbackRate}×`}
                    className={`${PILL_BUTTON} tabular-nums`}
                    onClick={cycleSpeed}
                >
                    {playbackRate}×
                </button>
                <label className={`${PILL_BUTTON} cursor-pointer`}>
                    <input
                        type="checkbox"
                        checked={autoTurn}
                        onChange={(event) => onAutoTurnChange(event.target.checked)}
                        className="h-4 w-4 accent-highlight"
                    />
                    Turn pages automatically
                </label>
            </div>
        </div>
    );
}
