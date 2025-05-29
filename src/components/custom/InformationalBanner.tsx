"use client";

import { Button } from "../ui/button";

export default function InformationalBanner() {
  return (
    <div className="bg-[#C1FF7A] text-black px-4 py-2 text-center text-sm font-medium">
      <span className="inline-flex items-center">
        NEW MODEL
        <span className="mx-2">•</span>
        Meet AI Book Reader - a voice model for fluid, emotive reading.
        <Button variant="link" className="text-black font-semibold ml-2">
          Learn more →
        </Button>
      </span>
    </div>
  );
}
