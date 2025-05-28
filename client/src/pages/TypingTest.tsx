import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/TypingTest.module.css';

const TypingTest: React.FC = () => {
  // Sample sentences - could be expanded or fetched from an API later
  const sampleTexts = [
    "The quick brown fox jumps over the lazy dog.",
    "Programming is the art of telling another human what one wants the computer to do.",
    "Typing speed is measured in words per minute, where a word is standardized to five characters or keystrokes.",
    "Practice makes perfect when it comes to improving your typing speed and accuracy."
  ];
  
  const [textToType, setTextToType] = useState<string>(sampleTexts[Math.floor(Math.random() * sampleTexts.length)]);
  const [typedText, setTypedText] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [wpm, setWpm] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(100);
  const [errors, setErrors] = useState<number>(0);
  //const [totalKeystrokes, setTotalKeystrokes] = useState<number>(0);
  const [testCompleted, setTestCompleted] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start the timer when user begins typing
  useEffect(() => {
    if (startTime && !endTime) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(elapsed);
        
        // Calculate WPM in real-time
        // WPM = (characters typed / 5) / minutes elapsed
        if (elapsed > 0) {
          const minutes = elapsed / 60;
          const words = typedText.length / 5; // Standard: 1 word = 5 characters
          const currentWpm = Math.round(words / minutes);
          setWpm(currentWpm);
        }
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [startTime, endTime, typedText.length]);

  // Handle input changes
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const currentTypedValue = event.target.value;
    
    // Start timer on first keystroke
    if (!startTime && currentTypedValue.length > 0) {
      setStartTime(Date.now());
    }
    
    // Track total keystrokes for more accurate WPM
    //setTotalKeystrokes(prev => prev + 1);
    
    // Update typed text
    setTypedText(currentTypedValue);
    setCurrentIndex(currentTypedValue.length);
    
    // Calculate errors and accuracy
    let currentErrors = 0;
    for (let i = 0; i < currentTypedValue.length; i++) {
      if (i >= textToType.length || currentTypedValue[i] !== textToType[i]) {
        currentErrors++;
      }
    }
    setErrors(currentErrors);
    
    const currentAccuracy = currentTypedValue.length > 0
      ? ((currentTypedValue.length - currentErrors) / currentTypedValue.length) * 100
      : 100;
    setAccuracy(currentAccuracy);
    
    // Check if test is completed
    if (currentTypedValue.length >= textToType.length) {
      // Test completed
      if (!endTime) {
        setEndTime(Date.now());
        setTestCompleted(true);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        
        // Final WPM calculation
        const timeInMinutes = (Date.now() - (startTime || Date.now())) / 60000;
        const wordsTyped = textToType.length / 5; // Standard: 1 word = 5 characters
        const finalWpm = Math.round(wordsTyped / timeInMinutes);
        setWpm(finalWpm);
      }
    }
  };

  // Render text with character highlighting
  const renderText = () => {
    return textToType.split('').map((char, index) => {
      let className = '';
      
      if (index < typedText.length) {
        // Character has been typed
        className = typedText[index] === char ? styles.correct : styles.incorrect;
      }
      
      if (index === currentIndex) {
        // Current character to type
        className += ` ${styles.current}`;
      }
      
      return (
        <span key={index} className={className}>
          {char === ' ' ? '\u00A0' : char} {/* Replace space with non-breaking space */}
        </span>
      );
    });
  };

  // Reset the test
  const resetTest = () => {
    setTextToType(sampleTexts[Math.floor(Math.random() * sampleTexts.length)]);
    setTypedText('');
    setCurrentIndex(0);
    setStartTime(null);
    setEndTime(null);
    setElapsedTime(0);
    setWpm(0);
    setAccuracy(100);
    setErrors(0);
    //setTotalKeystrokes(0);
    setTestCompleted(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Focus on input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  // Focus input on component mount
  useEffect(() => {
    inputRef.current?.focus();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <div className={styles.typingTestContainer}>
      <h1 className={styles.title}>Typing Test</h1>
      
      <div className={styles.textDisplayContainer}>
        <p className={styles.textDisplay}>{renderText()}</p>
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
      />
      
      <div className={styles.statsContainer}>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Time:</span>
          <span className={styles.statValue}>{elapsedTime}s</span>
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
      </div>
      
      {testCompleted && (
        <div className={styles.resultContainer}>
          <h2 className={styles.resultTitle}>Test Completed!</h2>
          <p className={styles.resultText}>
            You typed at {wpm} WPM with {accuracy.toFixed(1)}% accuracy.
          </p>
          <button 
            className={styles.resetButton}
            onClick={resetTest}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default TypingTest;
