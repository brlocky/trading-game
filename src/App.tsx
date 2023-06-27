import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import { Chart } from './components/Chart';
import { GameInput, GameStateController } from './components/Game';
import { loadGameData, selectIsLoading, selectRisk, selectTickers, startGame, updatePositionSize } from './slices';
import { useAppDispatch, useAppSelector } from './hooks';

const App = () => {
  const isLoading = useAppSelector(selectIsLoading);
  const tickers = useAppSelector(selectTickers);
  const risk = useAppSelector(selectRisk);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadGameData());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!tickers.length) {
      return;
    }
    dispatch(startGame());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickers]);

  useEffect(() => {
    dispatch(updatePositionSize());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [risk]);

  return (
    <div className="flex flex-col w-full min-h-screen bg-slate-500 items-center">
      <ToastContainer />
      <GameStateController />
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
