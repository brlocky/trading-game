import { useEffect } from 'react';
import { Chart } from './components/Chart';
import { loadGameData, selectErrors, selectIsLoading, selectTickers, startGame } from './slices';
import { useDispatch, useSelector } from 'react-redux';

const App = () => {
  const isLoading = useSelector(selectIsLoading);
  const erros = useSelector(selectErrors);
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
      {!isLoading ? <Chart /> : <p>Loading</p>}
    </div>
  );
};

export default App;
