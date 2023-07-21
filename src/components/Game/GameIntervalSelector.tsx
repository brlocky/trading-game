import Dropdown, { IDropdownOption } from '../Forms/DropDown';
import { GameTimeInterval } from '../../types';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { selectInterval, updateInterval } from '../../slices';

export const GameIntervalSelector = () => {
  const gameInterval = useAppSelector(selectInterval);
  const dispatch = useAppDispatch();

  const onIntevalChange = (interval: IDropdownOption) => {
    dispatch(updateInterval(interval.value as GameTimeInterval));
  };

  const timeIntervals = [
    {
      value: '1',
      label: '1m',
    },
    {
      value: '5',
      label: '5m',
    },
    {
      value: '15',
      label: '15m',
    },
    {
      value: '60',
      label: '1h',
    },
    {
      value: '240',
      label: '4h',
    },
    {
      value: 'D',
      label: '1D',
    },
  ];
  return (
    <Dropdown options={timeIntervals} selectedOption={timeIntervals.find((t) => t.value === gameInterval)} onChange={onIntevalChange} />
  );
};
