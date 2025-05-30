import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from '../styles/TypingTest.module.css';
// Ensure component import path and casing are correct
import PerformanceGraph from '../components/PerformanceGraph';
// Corrected type import path casing to match user's folder 'Types'
import type { PerformanceDataPoint } from '../Types/index'; 

// Word list remains the same
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

const sentenceLengths = {
  short: 15, 
  medium: 30,
  long: 60
};

type Difficulty = 'short' | 'medium' | 'long';

const generateRandomSentence = (difficulty: Difficulty): string => {
  const length = sentenceLengths[difficulty];
  let sentence = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * commonWords.length);
    sentence += commonWords[randomIndex] + (i === length - 1 ? '' : ' ');
  }
  return sentence;
};

interface CharState {
  char: string;
  state: 'pending' | 'correct' | 'incorrect';
}

// PerformanceDataPoint interface is now imported from '../Types/index'

const TypingTest: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [textToTypeChars, setTextToTypeChars] = useState<CharState[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0); // Keep for live display
  const [finalTime, setFinalTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(100);
  const [errors, setErrors] = useState<number>(0); // Total errors
  const [totalKeystrokes, setTotalKeystrokes] = useState<number>(0); // Displayed in results
  const [testCompleted, setTestCompleted] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(true);
  const [performanceData, setPerformanceData] = useState<PerformanceDataPoint[]>([]); // State for graph data
  const lastWordEndIndexRef = useRef<number>(0);
  const lastErrorCountRef = useRef<number>(0);
  const wordIndexRef = useRef<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset the test state
  const resetTest = useCallback((newDifficulty: Difficulty = difficulty) => {
    const newSentence = generateRandomSentence(newDifficulty);
    const initialChars: CharState[] = newSentence.split('').map(char => ({ char, state: 'pending' }));
    setTextToTypeChars(initialChars);
    setCurrentIndex(0);
    setStartTime(null);
    setEndTime(null);
    setElapsedTime(0); // Reset elapsed time
    setFinalTime(null);
    setWpm(0);
    setAccuracy(100);
    setErrors(0);
    setTotalKeystrokes(0);
    setTestCompleted(false);
    setIsFocused(true);
    setPerformanceData([]);
    lastWordEndIndexRef.current = 0;
    lastErrorCountRef.current = 0;
    wordIndexRef.current = 0;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    containerRef.current?.focus();

  }, [difficulty]);

  // Initialize and handle difficulty changes
  useEffect(() => {
    resetTest(difficulty);
  }, [difficulty, resetTest]);

  // Timer Logic - Keep this to update elapsedTime state
  useEffect(() => {
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }
    if (startTime && !endTime) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const currentElapsedTime = Math.floor((now - startTime) / 1000);
        setElapsedTime(currentElapsedTime); // Update state for live display
      }, 1000);
    }
    // Cleanup interval on component unmount or when test ends
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [startTime, endTime]);

  // Function to calculate WPM
  const calculateCurrentWPM = useCallback((charIndex: number, currentTimeMs: number): number => {
    if (!startTime || currentTimeMs <= startTime) return 0;

    let correctCharsCount = 0;
    for(let i = 0; i < charIndex; i++) {
        if(i < textToTypeChars.length && textToTypeChars[i]?.state === 'correct') {
            correctCharsCount++;
        }
    }
    const minutes = (currentTimeMs - startTime) / 60000;
    if (minutes <= 0) return 0;
    const currentNetWpm = Math.round((correctCharsCount / 5) / minutes);
    return currentNetWpm >= 0 ? currentNetWpm : 0;

  }, [startTime, textToTypeChars]);

  // Handle Key Presses directly
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (testCompleted || !isFocused) return;

      const { key } = event;
      const currentTime = Date.now();

      if (!startTime && key.length === 1 && key !== ' ') {
        setStartTime(currentTime);
      }

      if (key === 'Backspace') {
        event.preventDefault();
        if (currentIndex > 0) {
          const newIndex = currentIndex - 1;
          let currentTotalErrors = errors;
          setTextToTypeChars(prevChars => {
            const newChars = [...prevChars];
            if (newChars[newIndex]) {
              if (newChars[newIndex].state === 'incorrect') {
                currentTotalErrors = Math.max(0, currentTotalErrors - 1);
              }
              newChars[newIndex].state = 'pending';
            }
            return newChars;
          });
          setErrors(currentTotalErrors);
          setCurrentIndex(newIndex);
        }
      } else if (key.length === 1 && currentIndex < textToTypeChars.length) {
        event.preventDefault();
        setTotalKeystrokes(prev => prev + 1);
        const expectedChar = textToTypeChars[currentIndex].char;
        let newState: CharState['state'];
        let currentTotalErrors = errors;

        if (key === expectedChar) {
          newState = 'correct';
        } else {
          newState = 'incorrect';
          currentTotalErrors++;
        }
        setErrors(currentTotalErrors);

        const updatedChars = [...textToTypeChars];
        updatedChars[currentIndex] = { ...updatedChars[currentIndex], state: newState };
        setTextToTypeChars(updatedChars);

        const newIndex = currentIndex + 1;
        setCurrentIndex(newIndex);

        if ((key === ' ' || newIndex === textToTypeChars.length) && startTime) {
            wordIndexRef.current++;
            const currentWpm = calculateCurrentWPM(newIndex, currentTime);
            const errorsSinceLastPoint = currentTotalErrors - lastErrorCountRef.current;
            
            setPerformanceData(prevData => [
                ...prevData,
                {
                    index: wordIndexRef.current,
                    wpm: currentWpm,
                    errors: errorsSinceLastPoint >= 0 ? errorsSinceLastPoint : 0
                }
            ]);
            lastWordEndIndexRef.current = newIndex;
            lastErrorCountRef.current = currentTotalErrors;
        }

        // Update live WPM display (based on current progress)
        if (startTime) {
            const liveWpm = calculateCurrentWPM(newIndex, currentTime);
            setWpm(liveWpm);
        }

        if (newIndex === textToTypeChars.length) {
          const finalEndTime = currentTime;
          setEndTime(finalEndTime); // Stop the timer interval
          setTestCompleted(true);
          const calculatedFinalTime = Math.floor(((finalEndTime - (startTime || finalEndTime)) / 1000));
          setFinalTime(calculatedFinalTime);
          setElapsedTime(calculatedFinalTime); // Ensure final time is shown

          const finalWpm = calculateCurrentWPM(newIndex, finalEndTime);
          setWpm(finalWpm);

          const finalAccuracy = textToTypeChars.length > 0
            ? ((textToTypeChars.length - currentTotalErrors) / textToTypeChars.length) * 100
            : 100;
          setAccuracy(finalAccuracy < 0 ? 0 : finalAccuracy);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, textToTypeChars, testCompleted, startTime, isFocused, errors, calculateCurrentWPM]);

  // Handle focus/blur
  useEffect(() => {
    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);
    const currentRef = containerRef.current;
    if (currentRef) {
        currentRef.addEventListener('focus', handleFocus);
        currentRef.addEventListener('blur', handleBlur);
    }
    currentRef?.focus();
    return () => {
        if (currentRef) {
            currentRef.removeEventListener('focus', handleFocus);
            currentRef.removeEventListener('blur', handleBlur);
        }
    };
  }, []);

  // Render text characters
  const renderText = () => {
    return textToTypeChars.map((charState, index) => {
      let className = styles.charPending;
      if (charState.state === 'correct') {
        className = styles.charCorrect;
      } else if (charState.state === 'incorrect') {
        className = styles.charIncorrect;
      }
      if (index === currentIndex && isFocused) {
        className += ` ${styles.cursor}`;
      }
      return (
        <span key={index} className={className}>
          {charState.char}
        </span>
      );
    });
  };

  // Difficulty selection handler
  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
  };

  return (
    <div
      ref={containerRef}
      className={styles.typingTestContainer}
      tabIndex={0}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      <div className={styles.titlePlaceholder}>TYP3⌘T3ST</div>

      {/* Difficulty Selector - Hide when test is completed */} 
      {!testCompleted && (
        <div className={styles.difficultySelectorBox}>
          <button
            onClick={() => handleDifficultyChange('short')}
            className={difficulty === 'short' ? styles.activeDifficulty : ''}
          >
            Short
          </button>
          <button
            onClick={() => handleDifficultyChange('medium')}
            className={difficulty === 'medium' ? styles.activeDifficulty : ''}
          >
            Medium
          </button>
          <button
            onClick={() => handleDifficultyChange('long')}
            className={difficulty === 'long' ? styles.activeDifficulty : ''}
          >
            Long
          </button>
        </div>
      )}

      {/* Live Stats Display - Show only during active test */} 
      {!testCompleted && startTime && (
          <div className={styles.liveStatsContainer}>
             <span>Time: {elapsedTime}s</span>
             <span>WPM: {wpm}</span>
             {/* Can add live accuracy/errors here if needed */}
          </div>
      )}

      {/* Text Display Area */} 
      <div className={styles.textDisplayContainer}>
        {!isFocused && !testCompleted && <div className={styles.focusPrompt}>Click here to focus</div>}
        <div className={styles.textDisplay} key={difficulty + textToTypeChars.map(c=>c.char).join('')}> 
          {renderText()}
        </div>
      </div>

      {/* Results Area - Show only on completion */} 
      {testCompleted && (
        <div className={styles.resultsAreaContainer}> 
          <div className={styles.resultSummaryContainer}>
            <div className={styles.resultStat}> 
              <div className={styles.resultLabel}>WPM</div>
              <div className={styles.resultValue}>{wpm}</div>
            </div>
            <div className={styles.resultStat}> 
              <div className={styles.resultLabel}>ACC</div>
              <div className={styles.resultValue}>{accuracy.toFixed(1)}%</div>
            </div>
             <div className={styles.resultStat}> 
              <div className={styles.resultLabel}>Time</div>
              <div className={styles.resultValue}>{finalTime}s</div>
            </div>
             <div className={styles.resultStat}> 
              <div className={styles.resultLabel}>Errors</div>
              <div className={styles.resultValue}>{errors}</div>
            </div>
            <div className={styles.resultStat}> 
              <div className={styles.resultLabel}>Keystrokes</div>
              <div className={styles.resultValue}>{totalKeystrokes}</div>
            </div>
          </div>

          <div className={styles.graphContainer}>
            {performanceData.length > 0 ? (
              <PerformanceGraph data={performanceData} />
            ) : (
              <p>No performance data recorded.</p>
            )}
          </div>

          <button className={styles.resetButton} onClick={() => resetTest()}>Try Again</button>
        </div>
      )}

    </div>
  );
};

export default TypingTest;

