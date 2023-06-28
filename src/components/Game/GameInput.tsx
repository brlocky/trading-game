import { selectCapital, selectCurrentPosition, selectRisk, selectTradeCount, skipChart, startGame, updatePositionSize, updateRisk } from '../../slices';
import { formatCurrencyValue } from '../../utils/tradeUtils';
import Button from '../Forms/Button';
import { GameRisk } from '../../types';
import { useAppDispatch, useAppSelector } from '../../hooks';

export const GameInput = () => {
  const capital = useAppSelector(selectCapital);
  const tradeCount = useAppSelector(selectTradeCount);
  const position = useAppSelector(selectCurrentPosition);
  const risk = useAppSelector(selectRisk);
  const dispatch = useAppDispatch();

  const resetGame = () => {
    dispatch(startGame());
  };

  const nextChart = () => {
    dispatch(skipChart());
  };

  const setRisk = (r: GameRisk) => {
    dispatch(updateRisk(r));
    dispatch(updatePositionSize());
  };

  const isRiskSelected = (n: number) => {
    return n === risk;
  };

  const isSelectedClass = 'rounded-t-2xl';
  return (
    <div className="flex w-full justify-between p-4">
      <div className="flex gap-x-2 ">
        <Button onClick={resetGame}>New Game</Button>
        <Button onClick={nextChart} disabled={!!position}>Skip Chart</Button>
      </div>
      <div className="flex gap-x-2">
        <div className="bg-blue-200 rounded-sm items-center flex justify-center p-2">
          <span className="text-xs pr-2">Risk </span>
        </div>
        <Button onClick={() => setRisk(1)} className={`bg-green-400 ${isRiskSelected(1) ? isSelectedClass : ''}`}>
          1%
        </Button>
        <Button onClick={() => setRisk(5)} className={`bg-yellow-400 ${isRiskSelected(5) ? isSelectedClass : ''}`}>
          5%
        </Button>
        <Button onClick={() => setRisk(10)} className={`bg-orange-400 ${isRiskSelected(10) ? isSelectedClass : ''}`}>
          10%
        </Button>
        <Button onClick={() => setRisk(50)} className={`bg-red-400 ${isRiskSelected(50) ? isSelectedClass : ''}`}>
          50%
        </Button>
        <Button onClick={() => setRisk(100)} className={`bg-red-800 ${isRiskSelected(100) ? isSelectedClass : ''}`}>
          100%
        </Button>
      </div>
      <div className="flex gap-x-2">
        <div className="bg-blue-200 rounded-sm items-center flex p-2 justify-center">
          <span className="text-xs pr-2">Trades </span> {tradeCount}
        </div>
        <div className="bg-blue-200 rounded-sm items-center flex p-2 justify-center">
          <span className="text-xs pr-2">Capital </span>
          {formatCurrencyValue(capital)}
        </div>
      </div>
    </div>
  );
};
