import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from '../styles/TypingTest.module.css';
import Dropdown from '../components/Dropdown'; // Assuming Dropdown component exists

// Expanded word list for random sentence generation
const commonWords = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "I", 
  "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", 
  "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", 
  "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", 
  "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", 
  "when", "make", "can", "like", "time", "no", "just", "him", "know", "take", 
  "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", 
  "than", "then", "now", "look", "only", "come", "its", "over", "think", "also", 
  "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", 
  "even", "new", "want", "because", "any", "these", "give", "day", "most", "us",
  "apple", "banana", "orange", "grape", "kiwi", "melon", "peach", "pear", "plum", "berry",
  "table", "chair", "lamp", "desk", "sofa", "bed", "rug", "shelf", "clock", "mirror",
  "happy", "sad", "angry", "calm", "brave", "clever", "eager", "fair", "gentle", "jolly",
  "computer", "keyboard", "mouse", "screen", "code", "program", "software", "hardware", "internet", "website",
  "water", "coffee", "tea", "juice", "milk", "soda", "wine", "beer", "smoothie", "lemonade",
  "run", "walk", "jump", "swim", "fly", "dance", "sing", "read", "write", "draw",
  "fast", "slow", "quick", "loud", "quiet", "bright", "dark", "heavy", "light", "sharp"
];

// Define sentence length based on difficulty
const sentenceLengths = {
  short: 10, // words
  medium: 25, // words
  long: 50 // words
};

type Difficulty = 'short' | 'medium' | 'long';

// Function to generate random sentence
const generateRandomSentence = (difficulty: Difficulty): string => {
  const length = sentenceLengths[difficulty];
  let sentence = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * commonWords.length);
    sentence += commonWords[randomIndex] + (i === length - 1 ? '' : ' '); // Add space except for last word
  }
  return sentence;
};

const TypingTest: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [textToType, setTextToType] = useState<string>('');
  const [typedText, setTypedText] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0); // Live timer display
  const [finalTime, setFinalTime] = useState<number | null>(null); // Store final time for results
  const [wpm, setWpm] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(100);
  const [errors, setErrors] = useState<number>(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState<number>(0);
  const [testCompleted, setTestCompleted] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset the test state
  const resetTest = useCallback((newDifficulty: Difficulty = difficulty) => {
    setTextToType(generateRandomSentence(newDifficulty));
    setTypedText('');
    setCurrentIndex(0);
    setStartTime(null);
    setEndTime(null);
    setElapsedTime(0); // Reset live timer display
    setFinalTime(null); // Reset final time
    setWpm(0);
    setAccuracy(100);
    setErrors(0);
    setTotalKeystrokes(0);
    setTestCompleted(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [difficulty]);

  // Initialize with a sentence on mount and when difficulty changes
  useEffect(() => {
    resetTest(difficulty);
  }, [difficulty, resetTest]);

  // Timer and Real-time WPM Calculation Logic
useEffect(() => {
  if (!startTime || endTime || testCompleted) {
    // Stop the interval if no startTime, test is complete, or already ended
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return;
  }

  timerRef.current = setInterval(() => {
    // live time in seconds with two decimals
    const now = Date.now();
    const time = (now - startTime) / 1000;
    setElapsedTime(time);
    // Calculate live WPM
    if (time > 0 && typedText.length > 0) {
      const minutes = time / 60;
      let correctChars = 0;
      for (let i = 0; i < typedText.length; i++) {
        if (i < textToType.length && typedText[i] === textToType[i]) {
          correctChars++;
        }
      }
      const currentNetWpm = Math.round((correctChars / 5) / minutes);
      setWpm(currentNetWpm >= 0 ? currentNetWpm : 0);
    }
  }, 30); // Fast refresh for smooth 2 decimal places

  // Cleanup
  return () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
}, [startTime, endTime, testCompleted, typedText, textToType]);


  // Handle input changes, Accuracy, and Test Completion
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const currentTypedValue = event.target.value;

  if (testCompleted) return;

  // Start timer on first keystroke
  if (!startTime && currentTypedValue.length > 0) {
    setStartTime(Date.now());
  }

  setTotalKeystrokes(prev => prev + 1);
  setTypedText(currentTypedValue);
  setCurrentIndex(currentTypedValue.length);

  // Calculate errors and accuracy
  let currentErrors = 0;
  let correctCharsCount = 0;
  for (let i = 0; i < currentTypedValue.length; i++) {
    if (i >= textToType.length || currentTypedValue[i] !== textToType[i]) {
      currentErrors++;
    } else {
      correctCharsCount++;
    }
  }
  setErrors(currentErrors);

  const currentAccuracy =
    currentTypedValue.length > 0
      ? (correctCharsCount / currentTypedValue.length) * 100
      : 100;
  setAccuracy(currentAccuracy < 0 ? 0 : currentAccuracy);

  // Check if test is completed
  if (currentTypedValue.length === textToType.length) {
    const finalEndTime = Date.now();
    setEndTime(finalEndTime); // This stops the timer useEffect
    setTestCompleted(true);

    // Calculate final time in seconds (with two decimal places)
    const calculatedFinalTime = ((finalEndTime - (startTime || finalEndTime)) / 1000);
    setFinalTime(calculatedFinalTime); // Store final time (two decimals)
    setElapsedTime(calculatedFinalTime); // Ensure final time is shown in stats

    const timeInMinutes = calculatedFinalTime / 60;
    if (timeInMinutes > 0) {
      let finalCorrectChars = 0;
      for (let i = 0; i < textToType.length; i++) {
        if (currentTypedValue.length > i && currentTypedValue[i] === textToType[i]) {
          finalCorrectChars++;
        }
      }
      const finalWpm = Math.round((finalCorrectChars / 5) / timeInMinutes);
      setWpm(finalWpm >= 0 ? finalWpm : 0);
    } else {
      setWpm(0);
    }

    let finalCorrectCount = 0;
    for (let i = 0; i < textToType.length; i++) {
      if (currentTypedValue.length > i && currentTypedValue[i] === textToType[i]) {
        finalCorrectCount++;
      }
    }
    const finalAccuracy =
      textToType.length > 0
        ? (finalCorrectCount / textToType.length) * 100
        : 100;
    setAccuracy(finalAccuracy < 0 ? 0 : finalAccuracy);
  }
};


  // Render text with character highlighting
  const renderText = () => {
    return textToType.split('').map((char, index) => {
      let className = '';
      if (index < typedText.length) {
        className = typedText[index] === char ? styles.correct : styles.incorrect;
      }
      if (index === currentIndex) {
        className += ` ${styles.current}`;
      }
      return (
        <span key={index} className={className}>
          {char === ' ' ? '\u00A0' : char}
        </span>
      );
    });
  };

  // Handle difficulty change from Dropdown
  const handleDifficultyChange = (newDifficulty: string) => {
    setDifficulty(newDifficulty as Difficulty);
  };

  // Dropdown options
  const difficultyOptions = [
    { value: 'short', label: 'Short (~10 words)' },
    { value: 'medium', label: 'Medium (~25 words)' },
    { value: 'long', label: 'Long (~50 words)' },
  ];

  // Focus input on component mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className={styles.typingTestContainer}>
      <h1 className={styles.title}>Typing Test</h1>

      <div className={styles.controlsContainer}>
        <Dropdown
          options={difficultyOptions}
          value={difficulty}
          onChange={handleDifficultyChange}
          placeholder="Select Difficulty"
        />
      </div>

      <div className={styles.textDisplayContainer}>
        <p className={styles.textDisplay} key={textToType}>{renderText()}</p>
      </div>

      <input
        ref={inputRef}
        type="text"
        value={typedText}
        onChange={handleInputChange}
        className={styles.textInput}
        placeholder="Start typing here..."
        disabled={testCompleted}
        autoFocus
        aria-label="Typing input"
      />

      <div className={styles.statsContainer}>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Time:</span>
          {/* Display finalTime if test is completed, otherwise live elapsedTime */}
          <span className={styles.statValue}>
  {testCompleted && finalTime !== null
    ? finalTime.toFixed(2)
    : elapsedTime.toFixed(2)
  }s
</span>

        </div>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>WPM:</span>
          <span className={styles.statValue}>{wpm}</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Accuracy:</span>
          <span className={styles.statValue}>{accuracy.toFixed(1)}%</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Errors:</span>
          <span className={styles.statValue}>{errors}</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Keystrokes:</span>
          <span className={styles.statValue}>{totalKeystrokes}</span>
        </div>
      </div>

      {testCompleted && (
        <div className={styles.resultContainer}>
          <h2 className={styles.resultTitle}>Test Completed!</h2>
          <p className={styles.resultText}>
            {/* Display final stats including time */}
            Time: {finalTime !== null ? finalTime : elapsedTime}s | WPM: {wpm} | Accuracy: {accuracy.toFixed(1)}%
          </p>
          <button
            className={styles.resetButton}
            onClick={() => resetTest()} // Reset with current difficulty
          >
            Try Again (Same Difficulty)
          </button>
        </div>
      )}
    </div>
  );
};

export default TypingTest;

