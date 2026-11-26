"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

const SAMPLE_SRC = "/sample.mp3";

const USE_CASES = [
  {
    numeral: "i.",
    title: "Research papers",
    body: "Get through the reading list for seminar, page by page, without staring at dense columns.",
  },
  {
    numeral: "ii.",
    title: "Textbooks",
    body: "Follow the original pages on screen while you hear them, so diagrams and headings stay in view.",
  },
  {
    numeral: "iii.",
    title: "Books and long-form",
    body: "Your saved library keeps every PDF in one place, ready when you have a spare hour.",
  },
];

function formatTime(seconds: number) {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export default function Landing() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState(0);

  const toggleSample = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <audio
        ref={audioRef}
        src={SAMPLE_SRC}
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setElapsed(0);
          setProgress(0);
        }}
        onTimeUpdate={(event) => {
          const audio = event.currentTarget;
          setElapsed(audio.currentTime);
          setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
        }}
      />

      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <Link href="/" className="font-serif text-2xl sm:text-3xl">
            AI Book Reader
          </Link>
          <nav aria-label="Main" className="flex flex-wrap items-center gap-2 sm:gap-6">
            <a
              href="#what-it-reads"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              What it reads
            </a>
            <Link
              href="/sign-in"
              className="px-2 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/waitlist"
              className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Join the waitlist
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto flex max-w-6xl flex-col gap-7 px-6 pb-16 pt-20 sm:pt-24">
          <h1 className="max-w-5xl font-serif text-[clamp(3.25rem,8vw,7rem)] font-normal leading-[0.98] tracking-tight">
            Read with your eyes. Or your{" "}
            <span className="bg-highlight px-3 italic text-highlight-foreground">ears.</span> Or
            both.
          </h1>
          <div className="flex flex-wrap items-end justify-between gap-8">
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              AI Book Reader opens your PDFs page by page and reads them aloud, so long documents
              fit into a commute, a workout or a tired evening.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/waitlist"
                className="rounded-full bg-primary px-7 py-4 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Join the waitlist
              </Link>
              <button
                type="button"
                onClick={toggleSample}
                aria-pressed={isPlaying}
                className="rounded-full border border-zinc-600 px-7 py-4 font-semibold transition-colors hover:border-foreground"
              >
                {isPlaying ? "Pause sample" : "Listen to a sample"}
              </button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6" aria-label="Sample page">
          <div className="flex justify-center rounded-[28px] border border-border bg-card px-4 py-8 sm:p-16">
            <div className="relative w-full max-w-2xl rounded-md border border-border bg-secondary px-6 pb-32 pt-10 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)] sm:px-14 sm:pt-14">
              <p className="mb-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Chapter 1
              </p>
              <h2 className="mb-6 font-serif text-4xl font-normal leading-tight">
                The Time Machine
              </h2>
              <p className="mb-4 font-serif text-xl leading-relaxed text-zinc-200">
                The Time Traveller (for so it will be convenient to speak of him) was expounding a
                recondite matter to us.{" "}
                <span className="bg-highlight px-1 text-highlight-foreground">
                  His pale grey eyes shone and twinkled, and his usually pale face was flushed and
                  animated.
                </span>{" "}
                The fire burned brightly.
              </p>
              <p className="font-serif text-xl leading-relaxed text-zinc-500">
                Our chairs, being his patents, embraced and caressed us rather than submitted to be
                sat upon.
              </p>

              <div className="absolute bottom-7 left-1/2 flex w-[calc(100%-3rem)] max-w-lg -translate-x-1/2 items-center gap-3.5 rounded-full bg-primary py-2 pl-2 pr-5 text-primary-foreground">
                <button
                  type="button"
                  onClick={toggleSample}
                  aria-label={isPlaying ? "Pause sample" : "Play sample"}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-background text-highlight"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" fill="currentColor" />
                  ) : (
                    <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
                  )}
                </button>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="truncate text-sm font-medium">
                    {isPlaying ? "Page 1 · reading aloud" : "Page 1 · tap play to listen"}
                  </span>
                  <div className="h-1 overflow-hidden rounded-full bg-zinc-300">
                    <div
                      className="h-1 bg-background"
                      style={{ width: `${Math.round(progress * 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm tabular-nums text-zinc-700">{formatTime(elapsed)}</span>
              </div>
            </div>
          </div>
        </section>

        <section
          id="what-it-reads"
          className="mx-auto flex max-w-6xl scroll-mt-8 flex-col gap-14 px-6 pt-28"
        >
          <h2 className="max-w-3xl font-serif text-[clamp(2.5rem,5vw,4rem)] font-normal leading-[1.05]">
            Made for the long reads you keep putting off.
          </h2>
          <div className="grid border-t border-foreground md:grid-cols-3">
            {USE_CASES.map((useCase, index) => (
              <div
                key={useCase.title}
                className={`flex flex-col gap-3.5 border-border py-8 md:px-8 ${
                  index < USE_CASES.length - 1 ? "border-b md:border-b-0 md:border-r" : ""
                } ${index === 0 ? "md:pl-0" : ""} ${index === USE_CASES.length - 1 ? "md:pr-0" : ""}`}
              >
                <span className="font-serif text-6xl leading-none text-highlight">
                  {useCase.numeral}
                </span>
                <h3 className="text-xl font-semibold">{useCase.title}</h3>
                <p className="leading-relaxed text-muted-foreground">{useCase.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto flex max-w-6xl flex-col items-center gap-7 px-6 py-28 text-center">
          <p className="max-w-3xl font-serif text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.1]">
            Your next chapter is a{" "}
            <span className="bg-highlight px-2.5 italic text-highlight-foreground">click</span>{" "}
            away.
          </p>
          <Link
            href="/waitlist"
            className="rounded-full bg-primary px-7 py-4 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Join the waitlist
          </Link>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-7">
          <span className="font-serif text-xl">AI Book Reader</span>
        </div>
      </footer>
    </div>
  );
}
