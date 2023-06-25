import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Chart } from './components/Chart';
import { GameInput } from './components/Game';
import { loadGameData, selectIsLoading, selectRisk, selectTickers, startGame, updatePositionSize } from './slices';
import { AppDispatch } from './store/store';

const App = () => {
  const isLoading = useSelector(selectIsLoading);
  const tickers = useSelector(selectTickers);
  const risk = useSelector(selectRisk);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(loadGameData());
  }, []);

  useEffect(() => {
    if (!tickers.length) {
      return;
    }
    dispatch(startGame());
  }, [tickers]);

  useEffect(() => {
    dispatch(updatePositionSize());
  }, [risk]);

  return (
    <div className="flex flex-col w-full min-h-screen bg-slate-500 justify-center items-center relative">
      {!isLoading ? (
        <>
          <GameInput />
          <Chart />
        </>
      ) : (
        <p>Loading</p>
      )}
    </div>
  );
};

export default App;
