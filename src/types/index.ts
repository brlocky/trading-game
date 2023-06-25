import { CandlestickData } from '@felipecsl/lightweight-charts';

export type CandlestickDataWithVolume = CandlestickData & { volume: number };

export type IChartLineType = 'TP' | 'SL' | 'ENTRY';

export interface IChartLine {
  type: IChartLineType;
  price: string;
  qty?: string;
  draggable: boolean;
}
