import { UTCTimestamp } from '@felipecsl/lightweight-charts';
import { CandlestickDataWithVolume } from '../types';

export const mapKlineToCandleStickData = (kline: string[]): CandlestickDataWithVolume => {
  const [time, open, high, low, close, volume] = kline;
  return {
    time: (parseInt(time) / 1000) as UTCTimestamp,
    open: parseFloat(open),
    high: parseFloat(high),
    low: parseFloat(low),
    close: parseFloat(close),
    volume: parseFloat(volume),
  };
};
