import { useDispatch, useSelector } from 'react-redux';
import { selectCapital, selectRisk, selectTradeCount, skipChart, startGame, updateRisk } from '../../slices';
import { formatCurrencyValue } from '../../utils/tradeUtils';
import Button from '../Forms/Button';
import { IGameRisk } from '../../types';

export const GameInput = () => {
  const capital = useSelector(selectCapital);
  const tradeCount = useSelector(selectTradeCount);
  const risk = useSelector(selectRisk);

  const dispatch = useDispatch();
  const resetGame = () => {
    dispatch(startGame());
  };

  const nextChart = () => {
    dispatch(skipChart());
  };

  const setRisk = (r: IGameRisk) => {
    dispatch(updateRisk(r));
  };

  const isRiskSelected = (n: number) => {
    return n === risk;
  };

  const isSelectedClass = 'rounded-t-2xl';
  return (
    <div className="flex w-full justify-between p-4">
      <div className="flex gap-x-2 ">
        <Button onClick={resetGame}>New Game</Button>
        <Button onClick={nextChart}>Skip Chart</Button>
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
      </div>
      <div className="flex gap-x-2">
        <div className="bg-blue-200 rounded-sm items-center flex p-2 justify-center">
          <span className="text-xs pr-2">Trades </span> {tradeCount} / 10
        </div>
        <div className="bg-blue-200 rounded-sm items-center flex p-2 justify-center">
          <span className="text-xs pr-2">Capital </span>
          {formatCurrencyValue(capital)}
        </div>
      </div>
    </div>
  );
};
