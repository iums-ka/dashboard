/**
 * useBoardRotation Hook
 * 
 * Manages automatic rotation through multiple boards with progress animation.
 */

import { useState, useEffect, useRef } from 'react';
import { getUrgentTaskCount, calculateDisplayDuration } from '../utils/taskUtils';

/**
 * Hook for rotating through boards with progress animation
 * 
 * @param {Array} boards - Array of board objects
 * @param {Object} options - Configuration options
 * @returns {Object} - { currentIndex, progress, isTransitioning, reset }
 */
export function useBoardRotation(boards, options = {}) {
  const { enabled = true } = options;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const rotationTimerRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // Reset to first board
  const reset = () => {
    setCurrentIndex(0);
    setProgress(0);
    setIsTransitioning(false);
  };

  useEffect(() => {
    // Only rotate if enabled and we have multiple boards
    if (!enabled || !boards || boards.length <= 1) {
      setProgress(0);
      return;
    }

    // Clear existing timers
    if (rotationTimerRef.current) {
      clearTimeout(rotationTimerRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    // Get current board and calculate display duration
    const currentBoard = boards[currentIndex];
    const urgentCount = currentBoard ? getUrgentTaskCount(currentBoard) : 0;
    const duration = calculateDisplayDuration(urgentCount);
    
    // Reset progress and start animation
    setProgress(0);
    setIsTransitioning(false);
    
    // Progress animation - update every 100ms
    const progressStep = 100 / (duration / 100);
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + progressStep;
        return next >= 100 ? 100 : next;
      });
    }, 100);
    
    // Set timer for rotation
    rotationTimerRef.current = setTimeout(() => {
      setIsTransitioning(true);
      // Small delay for transition effect
      setTimeout(() => {
        setCurrentIndex((prev) => 
          prev >= boards.length - 1 ? 0 : prev + 1
        );
      }, 150);
    }, duration);

    // Cleanup
    return () => {
      if (rotationTimerRef.current) {
        clearTimeout(rotationTimerRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [boards, currentIndex, enabled]);

  return {
    currentIndex,
    progress,
    isTransitioning,
    reset,
  };
}

export default useBoardRotation;
