import { CandlestickData } from '@felipecsl/lightweight-charts';

export type CandlestickDataWithVolume = CandlestickData & { volume: number };

export type ChartLineType = 'TP' | 'SL' | 'ENTRY';

export interface IChartLine {
  type: ChartLineType;
  price: string;
  qty?: string;
  draggable: boolean;
}

export type GameRisk = 1 | 5 | 10 | 50 | 100;

export type GameTradeSide = 'Buy' | 'Sell';

export type GameState = 'start' | 'in-game' | 'trade-end' | 'symbol-end' | 'gameover';

export type GameLoadingState = 'idle' | 'pending';

export type GameTimeInterval = '1' | '5' | '15' | '60' | '240' | 'D';
