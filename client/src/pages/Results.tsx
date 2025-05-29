import React from 'react';
import styles from '../styles/Results.module.css';

interface ResultsProps {
  wpm: number;
  accuracy: number;
  time: number; // in seconds
  keystrokes: number;
  onTryAgain: () => void;
}

const Results: React.FC<ResultsProps> = ({
  wpm,
  accuracy,
  time,
  keystrokes,
  onTryAgain
}) => {
  // Format time to minutes:seconds
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <div className={styles.resultsContainer}>
      <h1 className={styles.resultsTitle}>Your Results</h1>
      
      <div className={styles.resultsGrid}>
        <div className={styles.resultCard}>
          <h2 className={styles.resultLabel}>WPM</h2>
          <div className={styles.resultValue}>{wpm}</div>
        </div>
        
        <div className={styles.resultCard}>
          <h2 className={styles.resultLabel}>Accuracy</h2>
          <div className={styles.resultValue}>{accuracy.toFixed(1)}%</div>
        </div>
        
        <div className={styles.resultCard}>
          <h2 className={styles.resultLabel}>Time</h2>
          <div className={styles.resultValue}>{formatTime(time)}</div>
        </div>
        
        <div className={styles.resultCard}>
          <h2 className={styles.resultLabel}>Keystrokes</h2>
          <div className={styles.resultValue}>{keystrokes}</div>
        </div>
      </div>
      
      <button 
        className={styles.tryAgainButton}
        onClick={onTryAgain}
      >
        Try Again
      </button>
    </div>
  );
};

export default Results;
