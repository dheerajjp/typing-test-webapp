// src/types/index.ts

// Define shared interfaces here

export interface PerformanceDataPoint {
  index: number; // Word index or time interval
  wpm: number;
  errors: number; // Errors *during* this interval/word
  rawWpm?: number; // Optional: raw WPM if needed
}

// Add other shared types/interfaces as needed

