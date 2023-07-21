import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Chart } from './components/Chart';
import { GameInput, GameStateController } from './components/Game';
import { useAppDispatch, useAppSelector } from './hooks';
import { loadGameData, selectInterval, selectIsLoading, selectTickers, startGame } from './slices';

const App = () => {
  const isLoading = useAppSelector(selectIsLoading);
  const tickers = useAppSelector(selectTickers);
  const interval = useAppSelector(selectInterval);
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
  }, [tickers, interval]);

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
