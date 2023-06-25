import { faForward, faStop } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useRef, useState } from 'react';
import Button from '../Forms/Button';
import { useDispatch, useSelector } from 'react-redux';
import { openPosition, playChart, selectChartLines, selectCurrentPosition, selectTrades, skipChart, startGame } from '../../slices';

export const ChartTools: React.FC = () => {
  const chartLines = useSelector(selectChartLines);
  const position = useSelector(selectCurrentPosition);
  const trades = useSelector(selectTrades);
  const dispatch = useDispatch();

  const [intervalId, setIntervalId] = useState<number | undefined>();
  const intervalRef = useRef<number>();

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
    console.log('New trade', trades);
    if (trades.length) {
      stopPlay();
    }
  }, [trades]);

  const newChart = () => {
    dispatch(skipChart());
  };

  const startPlay = () => {
    const id = setInterval(() => {
      dispatch(playChart({ index: 1 }));
    }, 10);
    setIntervalId(id);
  };

  const stopPlay = () => {
    clearInterval(intervalId);
    setIntervalId(undefined);
  };

  const tp = chartLines.find((l) => l.type === 'TP')?.price || '0';
  const sl = chartLines.find((l) => l.type === 'SL')?.price || '0';
  const price = chartLines.find((l) => l.type === 'ENTRY')?.price || '0';
  const openTrade = () => {
    dispatch(
      openPosition({
        position: { price, tp, sl },
      }),
    );
  };

  return (
    <div className="absolute top-0 z-10 flex gap-x-2 p-2 w-full justify-center">
      <div className="flex gap-x-2 rounded-lg bg-gray-700 p-2 ">
        <Button className="bg-blue-200" onClick={newChart}>
          Skip Chart
        </Button>
        {!position ? (
          <Button className="bg-blue-200" onClick={openTrade}>
            Open Trade
          </Button>
        ) : null}
        <Button className="bg-green-200" onClick={intervalId ? stopPlay : startPlay}>
          <FontAwesomeIcon icon={intervalId ? faStop : faForward} />
        </Button>
      </div>
    </div>
  );
};
