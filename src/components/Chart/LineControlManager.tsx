import { CustomPriceLineDraggedEventParams } from '@felipecsl/lightweight-charts';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { calculateTargetPnL, formatCurrencyValue } from '../../utils/tradeUtils';
import { IChartLine } from '../../types';
import {
  selectChartLines,
  selectCurrentPosition,
  selectCurrentPrice,
  selectEntryPrice,
  selectPositionSize,
  selectRisk,
  selectTickerInfo,
  updateChartLine,
  updatePositionSize,
} from '../../slices';

interface LineControlManagerProps {
  chartInstance: any;
  seriesInstance: any;
}

const TP = 'TP';
const SL = 'SL';
const ENTRY = 'ENTRY';
const SEPARATOR = ' > ';

export const LineControlManager: React.FC<LineControlManagerProps> = ({ chartInstance, seriesInstance }) => {
  const tickerInfo = useSelector(selectTickerInfo);
  const currentPosition = useSelector(selectCurrentPosition);
  const positionSize = useSelector(selectPositionSize);

  const chartLines = useSelector(selectChartLines);
  const entryPrice = useSelector(selectEntryPrice);
  const currentPrice = useSelector(selectCurrentPrice);
  const risk = useSelector(selectRisk);

  const chartLineRefs = useRef<any[]>([]);
  const linesRef = useRef<any>(undefined);

  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    setupChartLines();
    setIsLoading(false);
    chartInstance.subscribeCustomPriceLineDragged(priceLineHandler);
    setupChartLines();
    return () => {
      setIsLoading(true);
      chartInstance.unsubscribeCustomPriceLineDragged(priceLineHandler);
    };
  }, []);

  useEffect(() => {
    linesRef.current = [...chartLines];
    if (isLoading) return;
    setupChartLines();
  }, [chartLines]);

  useEffect(() => {
    if (isLoading) return;
    updateChartLines();
  }, [tickerInfo, positionSize, currentPosition]);

  const removeChartLines = () => {
    // Remove Lines
    [...chartLineRefs.current].forEach((lineRef) => {
      seriesInstance.removePriceLine(lineRef);
    });
    chartLineRefs.current = [];
  };

  const getLineTitle = (l: IChartLine, index: number) => {
    return `${l.type} ${index}${SEPARATOR}`;
  };

  const getLineConf = (l: IChartLine, index: number) => {
    const sharedConf = {
      title: getLineTitle(l, index),
      price: l.price,
      draggable: l.draggable,
      lineWidth: 1,
      lineStyle: null,
      axisLabelVisible: true,
    };
    switch (l.type) {
      case 'ENTRY':
        return {
          color: 'blue',
          ...sharedConf,
        };
      case 'SL':
        return {
          color: 'red',
          ...sharedConf,
        };
      case 'TP':
        return {
          color: 'green',
          ...sharedConf,
        };
    }
  };

  const setupChartLines = () => {
    // Remove Lines
    removeChartLines();

    // createCharLines
    chartLines.forEach((line, index) => {
      chartLineRefs.current.push(seriesInstance.createPriceLine(getLineConf(line, index)));
    });

    updateChartLines();
  };

  const updateChartLines = () => {
    const coinAmount = currentPosition ? Number(currentPosition.qty) : positionSize;

    chartLines.forEach((l, index) => {
      const lineRef = chartLineRefs.current[index];
      if (l.type === 'ENTRY') {
        const currentPnL = currentPosition ? formatCurrencyValue(calculateTargetPnL(currentPrice, entryPrice, coinAmount)) : '';
        lineRef.applyOptions({
          title: getLineTitle(l, ++index) + currentPnL,
          lineWidth: currentPosition ? 2 : 1,
          draggable: l.draggable,
        });
      } else {
        lineRef.applyOptions({
          title: getLineTitle(l, ++index) + formatCurrencyValue(calculateTargetPnL(l.price, entryPrice, l.qty || coinAmount)),
          lineWidth: currentPosition ? 2 : 1,
        });
      }
    });
  };

  const priceLineHandler = (params: CustomPriceLineDraggedEventParams) => {
    const { customPriceLine } = params;
    const { title, price } = customPriceLine.options();
    const formatedPrice: string = chartInstance.priceScale('right').formatPrice(price);
    const extractedIndex = Number(title.match(/(?:TP|SL|ENTRY) (\d+)(?: > )/)?.[1]) - 1;

    if (title.startsWith(TP) || title.startsWith(SL) || title.startsWith(ENTRY)) {
      dispatch(updateChartLine({ index: extractedIndex, line: { ...linesRef.current[extractedIndex], price: formatedPrice } }));
      dispatch(updatePositionSize());
    }
  };

  return null; // Since this component doesn't render anything, we return null
};
