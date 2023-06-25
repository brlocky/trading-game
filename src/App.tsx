import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Chart } from './components/Chart';
import { GameInput } from './components/Game';
import { loadGameData, selectIsLoading, selectTickers, startGame } from './slices';

const App = () => {
  const isLoading = useSelector(selectIsLoading);
  const tickers = useSelector(selectTickers);
  const dispatch = useDispatch();

  useEffect(() => {
    // client.getTickers({ category: 'linear', baseCoin: 'usdt' }).then(console.log);
    dispatch(loadGameData());
  }, []);

  useEffect(() => {
    if (!tickers.length) {
      return;
    }
    dispatch(startGame());
  }, [tickers]);

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
