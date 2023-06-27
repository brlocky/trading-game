import { useEffect, useState } from 'react';
import { selectGameState, selectTrades, skipChart, startGame } from '../../slices';
import Button from '../Forms/Button';
import { Modal } from '../Modal';
import { formatCurrencyValue } from '../../utils/tradeUtils';
import { useAppDispatch, useAppSelector } from '../../hooks';

export const GameStateController = () => {
  const gameState = useAppSelector(selectGameState);
  const [visible, setVisible] = useState(false);
  const trades = useAppSelector(selectTrades);
  const dispatch = useAppDispatch();

  useEffect(() => {
    switch (gameState) {
      case 'symbol-end':
      case 'trade-end':
      case 'gameover':
        setVisible(true);
        break;

      default:
        setVisible(false);
    }
  }, [gameState]);

  const renderContent = () => {
    let message;
    if (lastTrade) {
      if (gameState === 'trade-end') {
        message = 'Trade Closed with PnL >> ' + formatCurrencyValue(lastTrade.pnl);
      }

      if (gameState === 'symbol-end') {
        message = 'Symbol time ended';
      }
    }

    if (gameState === 'gameover') {
      const wins = trades.filter((t) => Number(t.pnl) >= 0).length;
      const loses = trades.filter((t) => Number(t.pnl) < 0).length;
      message = (
        <>
          <b>Game Over</b>
          <span>
            {wins} Wins vs {loses} Loses
          </span>
          <span>PnL {formatCurrencyValue(totalPnl)}</span>
        </>
      );
    }

    return message;
  };

  const nextTrade = () => {
    setVisible(false);
    setTimeout(() => {
      dispatch(skipChart());
    }, 2000);
  };

  const sameChart = () => {
    setVisible(false);

  };

  const newGame = () => {
    setVisible(false);
    setTimeout(() => {
      dispatch(startGame());
    }, 1500);
  };

  const lastTrade = [...trades].pop();
  const totalPnl = trades.reduce((total, t) => total + Number(t.pnl), 0);

  const bgColor =
    (gameState === 'trade-end' || gameState === 'gameover') && lastTrade ? (Number(lastTrade.pnl) > 0 ? 'bg-green-200' : 'bg-red-200') : '';
  return (
    <Modal open={visible}>
      <div className={`flex flex-col gap-x-5 gap-y-10 grow p-10 w-96 h-96 justify-between items-center rounded-2xl ${bgColor}`}>
        <div className="flex flex-col gap-y-2">{renderContent()}</div>
        <div className='flex gap-x-2'>
          {gameState === 'gameover' ? (
            <Button onClick={newGame}>New Game</Button>
          ) : (
            <>
              <Button onClick={sameChart}>Continue</Button>
              <Button onClick={nextTrade}>Next Chart</Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
