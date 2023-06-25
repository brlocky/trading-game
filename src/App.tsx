import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Chart } from './components/Chart';
import { GameInput } from './components/Game';
import { loadGameData, selectIsLoading, selectRisk, selectTickers, startGame, updatePositionSize } from './slices';
import { AppDispatch } from './store/store';
import { ToastContainer } from 'react-toastify';
import { Modal } from './components/Modal';

const App = () => {
  const isLoading = useSelector(selectIsLoading);
  const tickers = useSelector(selectTickers);
  const risk = useSelector(selectRisk);
  const dispatch = useDispatch<AppDispatch>();

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
      <Modal open={true} header={'Modal'} >Ola</Modal>
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
