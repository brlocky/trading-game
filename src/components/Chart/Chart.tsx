import { ColorType, CrosshairMode, createChart } from '@felipecsl/lightweight-charts';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { CandlestickDataWithVolume } from '../../types';
import { selectInterval, selectKlines, selectTickerInfo, selectklineUpdate } from '../../slices';
import { mapKlineToCandleStickData } from '../../mappers';
import { RestClientV5 } from 'bybit-api/lib/rest-client-v5';
import { debounce } from 'lodash';
import { ChartTools } from './ChartTools';
import { LineControlManager } from './LineControlManager';

interface Props {
  colors?: {
    backgroundColor?: string;
    lineColor?: string;
    textColor?: string;
    areaTopColor?: string;
    areaBottomColor?: string;
    volumeColor?: string;
  };
}

export const Chart: React.FC<Props> = (props) => {
  const {
    colors: {
      backgroundColor = 'white',
      lineColor = '#2962FF',
      textColor = 'black',
      areaTopColor = 'rgba(0, 0, 0, 0)',
      areaBottomColor = 'rgba(0, 0, 0, 0)',
      volumeColor = '#525151a0',
    } = {},
  } = props;

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadedCandles, setLoadedCandles] = useState<CandlestickDataWithVolume[]>([]);
  const [loadedChuncks, setLoadedChuncks] = useState<string[]>([]);

  const newSeries = useRef<any>(null);
  const newVolumeSeries = useRef<any>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);
  const timeScaleRef = useRef<any>(null);
  const loadedCandlesRef = useRef<any>(null);
  const loadedChuncksRef = useRef<any>(null);

  const klines = useSelector(selectKlines);
  const kline = useSelector(selectklineUpdate);
  const tickerInfo = useSelector(selectTickerInfo);
  const interval = useSelector(selectInterval);
  const apiClient = new RestClientV5();

  const handleResize = () => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.applyOptions({
        width: chartContainerRef.current?.clientWidth || 0,
      });
    }
  };

  const listenChartTimeScale = useCallback(
    debounce(() => {
      const logicalRange = timeScaleRef.current.getVisibleLogicalRange();
      console.log(logicalRange);
      if (logicalRange !== null) {
        const barsInfo = newSeries.current.barsInLogicalRange(logicalRange);
        if (barsInfo !== null && barsInfo.barsBefore < 10) {
          if (loadedChuncksRef.current.includes(barsInfo.from)) {
            return;
          }
          setLoadedChuncks([...loadedChuncksRef.current, barsInfo.from]);
          apiClient
            .getKline({
              category: 'linear',
              symbol: tickerInfo?.symbol as string,
              interval: interval,
              end: Number(barsInfo.from) * 1000,
            })
            .then((r) => {
              const candleStickData = r.result.list.map(mapKlineToCandleStickData).sort((a, b) => (a.time as number) - (b.time as number));
              const allData = [...candleStickData, ...loadedCandlesRef.current].sort((a, b) => (a.time as number) - (b.time as number));
              const uniqueArr = allData.filter((item, index) => {
                return (
                  index ===
                  allData.findIndex((t) => {
                    return t.time === item.time;
                  })
                );
              });

              setLoadedCandles(uniqueArr);
            });
        }
      }
    }, 50),
    [],
  );

  const initChart = () => {
    if (!chartContainerRef.current) {
      console.error('Chart Container not defined');
      return;
    }

    console.log('initChart chart');

    chartInstanceRef.current = createChart(chartContainerRef.current, {
      timeScale: {
        timeVisible: true,
        ticksVisible: true,
      },
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      rightPriceScale: {
        ticksVisible: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.3,
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
    });

    newSeries.current = chartInstanceRef.current.addCandlestickSeries({
      lineColor,
      topColor: areaTopColor,
      bottomColor: areaBottomColor,
      priceFormat: {
        type: 'price',
        precision: tickerInfo?.priceScale,
        minMove: tickerInfo?.priceFilter.tickSize,
      },
    });

    const allKlines = JSON.parse(JSON.stringify(klines));
    console.log('allKlines', allKlines);
    setLoadedCandles(allKlines);
    newSeries.current.setData(allKlines);
    newVolumeSeries.current = chartInstanceRef.current.addHistogramSeries({
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // set as an overlay by setting a blank priceScaleId
    });
    newVolumeSeries.current.priceScale().applyOptions({
      // set the positioning of the volume series
      scaleMargins: {
        top: 0.9, // highest point of the series will be 70% away from the top
        bottom: 0,
      },
    });

    const volumeData = allKlines.map((d: CandlestickDataWithVolume) => {
      return { time: d.time, value: d.volume, color: volumeColor };
    });
    newVolumeSeries.current.setData(volumeData);

    timeScaleRef.current = chartInstanceRef.current.timeScale();
    timeScaleRef.current.subscribeVisibleLogicalRangeChange(listenChartTimeScale);
    timeScaleRef.current.fitContent();

    console.log('initChart chart - ok');
  };

  const destroyChart = () => {
    console.log('Destroy chart');
    if (!chartInstanceRef.current) {
      console.log('Destroy chart - fail');
      return;
    }

    timeScaleRef.current.unsubscribeVisibleLogicalRangeChange(listenChartTimeScale);
    newSeries.current = null;
    newVolumeSeries.current = null;
    chartInstanceRef.current.remove();
    chartInstanceRef.current = null;
    timeScaleRef.current = null;
    console.log('Destroy chart - ok');
  };

  // Handle Resize
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Build Chart
  useEffect(() => {
    setIsLoading(true);
    if (!klines.length) return;
    initChart();

    setIsLoading(false);

    return () => {
      setIsLoading(true);
      destroyChart();
    };
  }, [klines]);

  // Update Kline
  useEffect(() => {
    if (isLoading || !kline) {
      console.log('skipkline', isLoading, !!kline);
      return;
    }
    const parsedKline = JSON.parse(JSON.stringify(kline)) as CandlestickDataWithVolume;
    newSeries.current.update(parsedKline);
    newVolumeSeries.current.update({ time: kline.time, value: kline.volume, color: 'pink' });
  }, [kline]);

  // Update loaded candles
  useEffect(() => {
    loadedCandlesRef.current = loadedCandles;
    if (isLoading) return;
    newSeries.current.setData(loadedCandles);
    const volumeData = loadedCandles.map((d: CandlestickDataWithVolume) => {
      return { time: d.time, value: d.volume, color: volumeColor };
    });
    newVolumeSeries.current.setData(volumeData);
  }, [loadedCandles]);

  useEffect(() => {
    loadedChuncksRef.current = loadedChuncks;
  }, [loadedChuncks]);

  return (
    <div ref={chartContainerRef} className="relative w-full">
      {!isLoading ? (
        <>
          <ChartTools />
          <LineControlManager chartInstance={chartInstanceRef.current} seriesInstance={newSeries.current} />
        </>
      ) : null}
    </div>
  );
};
