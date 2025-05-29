import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from '../styles/TypingTest.module.css';

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

const TypingTest: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [textToTypeChars, setTextToTypeChars] = useState<CharState[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [finalTime, setFinalTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(100);
  const [errors, setErrors] = useState<number>(0);
  const [testCompleted, setTestCompleted] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(true);

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
    setElapsedTime(0);
    setFinalTime(null);
    setWpm(0);
    setAccuracy(100);
    setErrors(0);
    setTestCompleted(false);
    setIsFocused(true);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // Focus the main container to capture keydown events
    setTimeout(() => {
      containerRef.current?.focus();
    }, 0);
  }, [difficulty]);

  // Initialize and handle difficulty changes
  useEffect(() => {
    resetTest(difficulty);
  }, [difficulty, resetTest]);

  // Timer Logic with 2 decimals
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (startTime && !endTime) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const currentElapsedTime = (now - startTime) / 1000;
        setElapsedTime(currentElapsedTime);

        // Real-time WPM (Net WPM)
        if (currentElapsedTime > 0) {
          let correctCharsCount = 0;
          for (let i = 0; i < currentIndex; i++) {
            if (textToTypeChars[i]?.state === 'correct') {
              correctCharsCount++;
            }
          }
          const minutes = currentElapsedTime / 60;
          const currentNetWpm = Math.round((correctCharsCount / 5) / minutes);
          setWpm(currentNetWpm >= 0 ? currentNetWpm : 0);
        }
      }, 30); // 30ms for smooth decimals
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [startTime, endTime, currentIndex, textToTypeChars]);

  // Handle Key Presses directly
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (testCompleted || !isFocused) return;

      const { key } = event;

      // Start timer on first valid keypress
      if (!startTime && key.length === 1) {
        setStartTime(Date.now());
      }

      if (key === 'Backspace') {
        event.preventDefault();
        if (currentIndex > 0) {
          const newIndex = currentIndex - 1;
          setTextToTypeChars(prevChars => {
            const newChars = [...prevChars];
            if (newChars[newIndex]) {
              if (newChars[newIndex].state === 'incorrect') {
                setErrors(prev => prev - 1);
              }
              newChars[newIndex].state = 'pending';
            }
            return newChars;
          });
          setCurrentIndex(newIndex);
        }
      } else if (key.length === 1 && currentIndex < textToTypeChars.length) {
        event.preventDefault();
        const expectedChar = textToTypeChars[currentIndex].char;
        let newState: CharState['state'];

        if (key === expectedChar) {
          newState = 'correct';
        } else {
          newState = 'incorrect';
          setErrors(prev => prev + 1);
        }

        setTextToTypeChars(prevChars => {
          const newChars = [...prevChars];
          newChars[currentIndex] = { ...newChars[currentIndex], state: newState };
          return newChars;
        });

        const newIndex = currentIndex + 1;
        setCurrentIndex(newIndex);

        // Check for completion
        if (newIndex === textToTypeChars.length) {
          const finalEndTime = Date.now();
          setEndTime(finalEndTime);
          setTestCompleted(true);
          const calculatedFinalTime = (finalEndTime - (startTime || finalEndTime)) / 1000;
          setFinalTime(calculatedFinalTime);
          setElapsedTime(calculatedFinalTime);

          // Final WPM & Accuracy
          const timeInMinutes = calculatedFinalTime / 60;
          let finalCorrectChars = 0;
          textToTypeChars.forEach((charState, index) => {
            if (index < textToTypeChars.length - 1 && charState.state === 'correct') {
              finalCorrectChars++;
            } else if (index === textToTypeChars.length - 1 && newState === 'correct') {
              finalCorrectChars++;
            }
          });

          if (timeInMinutes > 0) {
            const finalWpm = Math.round((finalCorrectChars / 5) / timeInMinutes);
            setWpm(finalWpm >= 0 ? finalWpm : 0);
          } else {
            setWpm(0);
          }

          const finalAccuracy = textToTypeChars.length > 0
            ? ((textToTypeChars.length - errors) / textToTypeChars.length) * 100
            : 100;
          setAccuracy(finalAccuracy < 0 ? 0 : finalAccuracy);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, textToTypeChars, testCompleted, startTime, isFocused, errors]);

  // Handle focus/blur of the component area
  useEffect(() => {
    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);
    const ref = containerRef.current;
    if (ref) {
      ref.addEventListener('focus', handleFocus);
      ref.addEventListener('blur', handleBlur);
    }
    ref?.focus();
    return () => {
      if (ref) {
        ref.removeEventListener('focus', handleFocus);
        ref.removeEventListener('blur', handleBlur);
      }
    };
  }, []);

  // Render text characters with state-based styling
  const renderText = () => {
    return textToTypeChars.map((charState, index) => {
      let className = styles.charPending;
      if (charState.state === 'correct') {
        className = styles.charCorrect;
      } else if (charState.state === 'incorrect') {
        className = styles.charIncorrect;
      }
      if (index === currentIndex) {
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
      <div className={styles.titlePlaceholder}>Type-Test ⌘</div>
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
      <div className={styles.textDisplayContainer}>
        {!isFocused && !testCompleted && <div className={styles.focusPrompt}>Click here to focus</div>}
        <div className={styles.textDisplay} key={difficulty}>
          {renderText()}
        </div>
      </div>
      <div className={styles.statsContainer}>
        <span>Time: {testCompleted && finalTime !== null ? finalTime.toFixed(2) : elapsedTime.toFixed(2)}s</span>
        <span>WPM: {wpm}</span>
        <span>Acc: {accuracy.toFixed(1)}%</span>
        <span>Errors: {errors}</span>
      </div>
      {testCompleted && (
        <div className={styles.resultContainer}>
          <h2>Test Completed!</h2>
          <p>
            Time: {finalTime !== null ? finalTime.toFixed(2) : elapsedTime.toFixed(2)}s | WPM: {wpm} | Accuracy: {accuracy.toFixed(1)}%
          </p>
          <button onClick={() => resetTest()}>Try Again</button>
        </div>
      )}
    </div>
  );
};

export default TypingTest;
