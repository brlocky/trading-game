import { faForward, faStop } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  loadChartFuture,
  openPosition,
  playChart,
  selectChartLines,
  selectCurrentPosition,
  selectGameState,
  selectKlines2End,
  setupTrade,
} from '../../slices';
import { AppDispatch } from '../../store/store';
import Button from '../Forms/Button';

export const ChartTools: React.FC = () => {
  const chartLines = useSelector(selectChartLines);
  const klines2End = useSelector(selectKlines2End);
  const position = useSelector(selectCurrentPosition);
  const gameState = useSelector(selectGameState);
  const dispatch = useDispatch<AppDispatch>();

  const [intervalId, setIntervalId] = useState<number | undefined>();
  const intervalRef = useRef<number>();
  const klines2EndRef = useRef<number>();

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    intervalRef.current = intervalId;
  }, [intervalId]);

  useEffect(() => {
    klines2EndRef.current = klines2End;
  }, [klines2End]);

  useEffect(() => {
    if (position) {
      startPlay();
    } else {
      stopPlay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  useEffect(() => {
    switch (gameState) {
      case 'gameover':
      case 'symbol-end':
      case 'trade-end':
        stopPlay();
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  const startPlay = () => {
    if (intervalId) return;
    const id = setInterval(
      () => {
        if (klines2EndRef.current && klines2EndRef.current === 100) {
          dispatch(loadChartFuture());
        }

        dispatch(playChart());
      },
      position ? 25 : 250,
    );
    setIntervalId(id);
  };

  const stopPlay = () => {
    if (!intervalId) return;
    clearInterval(intervalId);
    setIntervalId(undefined);
  };

  const openTrade = () => {
    if (!chartLines.length) {
      return;
    }
    const tp = chartLines.find((l) => l.type === 'TP')?.price || '0';
    const sl = chartLines.find((l) => l.type === 'SL')?.price || '0';
    const price = chartLines.find((l) => l.type === 'ENTRY')?.price || '0';
    dispatch(openPosition({ position: { price, tp, sl } }));
  };

  const addLines = () => {
    dispatch(setupTrade());
  };

  return (
    <div className="absolute top-0 z-10 flex gap-x-2 p-2 w-full justify-center">
      <div className="flex gap-x-2 rounded-lg bg-gray-700 p-2 ">
        {!position && chartLines.length ? (
          <>
            <Button className="bg-blue-200" onClick={openTrade}>
              Open Trade
            </Button>
          </>
        ) : null}
        {!chartLines.length ? (
          <>
            <Button className="bg-blue-200" onClick={addLines}>
              Setup Trade
            </Button>
            <Button className="bg-green-200" onClick={intervalId ? stopPlay : startPlay}>
              <FontAwesomeIcon icon={intervalId ? faStop : faForward} />
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
};
