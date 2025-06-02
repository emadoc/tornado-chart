/* eslint-disable no-new */
import {
  AppliedPrompts,
  Context,
  onDrillDownFunction,
  ResponseData,
  TContext
} from '@incorta-org/component-sdk';
import Chart from 'chart.js';
import React, { useEffect, useMemo, useRef } from 'react';
import { formatNumber } from './formatNumber';
import ChartDataLabels from 'chartjs-plugin-datalabels';

interface Props {
  context: Context<TContext>;
  prompts: AppliedPrompts;
  data: ResponseData;
  drillDown: onDrillDownFunction;
}

const TornadoChart = ({ context, prompts, data, drillDown }: Props) => {
  const { showValues = true } = context.component.settings ?? {};

  const color1 =
    context.component.bindings?.measure?.[0].settings?.color ?? context.app.color_palette[0];
  const color2 =
    context.component.bindings?.measure?.[1].settings?.color ?? context.app.color_palette[1];
  const format1 = context.component.bindings?.measure?.[0].settings?.format;
  const format2 = context.component.bindings?.measure?.[1].settings?.format;

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { width, height } = context.component.dimensions;

  const { barChartData, catLabel, data1Label, data2Label } = useMemo(() => {
    const labels: string[] = [];
    const data1: any[] = [];
    const data2: any[] = [];

    const catLabel = data.rowHeaders?.[0].label;
    const data1Label = data.measureHeaders[0].label;
    const data2Label = data.measureHeaders[1].label;

    data.data.forEach(point => {
      labels.push(point[0].value);
      data1.push(point[1].value);
      data2.push(point[2].value);
    });

    return {
      labels,
      data1,
      data2,
      catLabel,
      data1Label,
      data2Label,
      barChartData: {
        labels,
        datasets: [
          {
            label: data1Label,
            backgroundColor: color1,
            data: data1.map(Number).map(k => -k),
            datalabels: {
              anchor: 'start',
              align: 'start',
              formatter: function (_: any, c: any) {
                return formatNumber(
                  data.data?.[c.dataIndex!]?.[c.datasetIndex! + 1].value,
                  format1
                );
              }
            }
          },
          {
            label: data2Label,
            backgroundColor: color2,
            data: data2.map(Number),
            datalabels: {
              anchor: 'end',
              align: 'end',
              formatter: function (_: any, c: any) {
                return formatNumber(
                  data.data?.[c.dataIndex!]?.[c.datasetIndex! + 1].value,
                  format2
                );
              }
            }
          }
        ]
      }
    };
  }, [data, color1, color2]);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      const chartRender = new Chart(ctx, {
        type: 'horizontalBar',
        data: barChartData,
        plugins: [showValues && ChartDataLabels].filter(Boolean),
        options: {
          animation: {
            duration: 0
          },
          tooltips: {
            intersect: false,
            callbacks: {
              title(tooltipItem, data) {
                const label = tooltipItem[0].label;
                return `${catLabel}: ${label}`;
              },
              label: c => {
                let retStr = '';
                if (c.datasetIndex === 0) {
                  retStr += `${data1Label}: ${formatNumber(-c.value!, format1, false)}`;
                } else {
                  retStr += `${data2Label}: ${formatNumber(c.value, format2, false)}`;
                }
                return retStr;
              }
            }
          },
          responsive: true,
          maintainAspectRatio: false,
          legend: {
            position: 'bottom'
          },
          scales: {
            xAxes: [
              {
                stacked: false,
                ticks: {
                  beginAtZero: true,
                  fontSize: 13,
                  callback: (v: any, i) => {
                    return v < 0 ? formatNumber(-v, format1) : formatNumber(v, format2);
                  }
                }
              }
            ],
            yAxes: [
              {
                scaleLabel: {
                  display: true,
                  labelString: catLabel
                },
                stacked: true,
                ticks: {
                  beginAtZero: true,
                  fontSize: 13
                },
                position: 'left'
              }
            ]
          }
        }
      });

      return () => {
        chartRender.destroy();
      };
    }
  }, [barChartData, showValues, width, height]);

  return <canvas ref={canvasRef} style={{ width, height }} />;
};

export default TornadoChart;
