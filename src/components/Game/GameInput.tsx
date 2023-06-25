import * as React from 'react';
import Button from '../Forms/Button';
import { useDispatch, useSelector } from 'react-redux';
import { selectCapital, selectTradeCount, startGame } from '../../slices';
import { formatCurrencyValue } from '../../utils/tradeUtils';

export interface IGameInput {}

export const GameInput = (props: IGameInput) => {
  const capital = useSelector(selectCapital);
  const tradeCount = useSelector(selectTradeCount);

  const dispatch = useDispatch();
  const resetGame = () => {
    dispatch(startGame());
  };

  return (
    <div className="flex w-full justify-between p-4">
      <div className="flex gap-x-2 w-full">
        <Button onClick={resetGame}>New Game</Button>
      </div>
      <div className="flex gap-x-2">
        <div className="bg-blue-200 rounded-sm items-center flex w-32 justify-center">
          <span className="text-xs pr-2">Trades </span> {tradeCount} / 10
        </div>
        <div className="bg-blue-200 rounded-sm items-center flex w-32 justify-center">
          <span className="text-xs pr-2">Capital </span>
          {formatCurrencyValue(capital)}
        </div>
      </div>
    </div>
  );
};
