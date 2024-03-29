import type { MetaFunction, LoaderFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { useState, useEffect } from 'react';

export const meta: MetaFunction = () => {
  return [
    { title: "Sentiment Charts" },
    { name: "description", content: "Charts displaying sentiment data & price from IG Trading" },
  ];
};

//Make typescript changes

export let loader: LoaderFunction = async ({context}) => {
  const baseURL = (context.env as {API_URL: string}).API_URL;
  /// Getting all data
  // let fullUrlAllData = baseURL + '/allDataPoints';
  // let responseAllData = await fetch(fullUrlAllData);
  // let allData = await responseAllData.json();
  /// Getting daily data
  let fullUrlDailyData = baseURL + '/dailyDataPoints';
  let responseDailyData = await fetch(fullUrlDailyData);
  let dailyData = await responseDailyData.json();
  /// Returning both data sets in one object
  //return json({allData, dailyData, apiUrl: (context.env as {API_URL: string}).API_URL});
  // Returning only daily data
  return json({dailyData, apiUrl: (context.env as {API_URL: string}).API_URL});
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload) {
    const sentimentPayload = payload.find(p => ['sentimentScoreIs50', 'sentimentScoreBelow50', 'sentimentScoreAbove50'].includes(p.name) && p.value !== null);
    const pricePayload = payload.find(p => p.name === 'price');

    return (
      <div className="custom-tooltip" style={{ backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '5px' }}>
        {sentimentPayload && <p className="intro">Sentiment Score : <strong>{sentimentPayload.value}</strong></p>}
        {pricePayload && <p className="intro">{`Price : ${pricePayload.value}`}</p>}
        <p className="label">{`Time : ${label}`}</p>
      </div>
    );
  }

  return null;
};

function CustomChart({ data, title }) {
  let prevItem = null;
  const chartData = data.results.map(item => {
    const newItem = {
      unixTime: new Date(item.unixTime * 1000).toISOString().slice(0, 16).replace('T', ' '),
      price: item.price,
      sentimentScoreBelow50: item.longPositionPercentage < 50 ? item.longPositionPercentage : null,
      sentimentScoreAbove50: item.longPositionPercentage > 50 ? item.longPositionPercentage : null,
      sentimentScoreIs50: item.longPositionPercentage === 50 ? item.longPositionPercentage : null,
    };

    // Extend the previous line to give illusion of 1 line
    if (prevItem) {
      if (prevItem.longPositionPercentage < 50 && item.longPositionPercentage > 50) {
        newItem.sentimentScoreBelow50 = item.longPositionPercentage;
      } else if (prevItem.longPositionPercentage > 50 && item.longPositionPercentage < 50) {
        newItem.sentimentScoreAbove50 = item.longPositionPercentage;
      } else if (prevItem.longPositionPercentage < 50 && item.longPositionPercentage === 50) {
        newItem.sentimentScoreBelow50 = item.longPositionPercentage;
      } else if (prevItem.longPositionPercentage > 50 && item.longPositionPercentage === 50) {
        newItem.sentimentScoreAbove50 = item.longPositionPercentage;
      } else if (prevItem.longPositionPercentage === 50 && item.longPositionPercentage !== 50) {
        newItem.sentimentScoreIs50 = item.longPositionPercentage;
      }
    }

    prevItem = item;
    return newItem;
  });

  // Find the most recent sentiment score
  let mostRecentSentimentScore = null;
  for (let i = chartData.length - 1; i >= 0; i--) {
    const item = chartData[i];
    if (item.sentimentScoreIs50 !== null) {
      mostRecentSentimentScore = item.sentimentScoreIs50;
      break;
    } else if (item.sentimentScoreBelow50 !== null) {
      mostRecentSentimentScore = item.sentimentScoreBelow50;
      break;
    } else if (item.sentimentScoreAbove50 !== null) {
      mostRecentSentimentScore = item.sentimentScoreAbove50;
      break;
    }
  }

  return (
    <div className="flex items-center">
      <div>
        <h2 className="text-center text-4xl">{title}</h2>
        <LineChart width={1000} height={500} data={chartData}>
          <Line type="monotone" dataKey="price" stroke="#8884d8" yAxisId="left" dot={false} />
          <Line type="monotone" dataKey="sentimentScoreIs50" stroke="grey" dot={false} strokeWidth={6} yAxisId="right" />
          <Line type="monotone" dataKey="sentimentScoreBelow50" stroke="red" dot={false} strokeWidth={6} yAxisId="right" />
          <Line type="monotone" dataKey="sentimentScoreAbove50" stroke="green" dot={false} strokeWidth={6} yAxisId="right" />
          <XAxis dataKey="unixTime" tick={false} />
          <YAxis yAxisId="left" domain={['auto', 'auto']} tick={false} />
          <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
          {/*<ReferenceLine y={50} stroke="black" strokeOpacity={0.5} />
          <ReferenceLine y={25} stroke="grey" strokeOpacity={0.2} />
          <ReferenceLine y={75} stroke="grey" strokeOpacity={0.2} />*/}
          <Tooltip content={CustomTooltip} isAnimationActive={false} />
        </LineChart>
      </div>
      <div className="ml-4">
        <span style={{ 
          color: 'white', 
          backgroundColor: mostRecentSentimentScore < 50 ? 'red' : mostRecentSentimentScore > 50 ? 'green' : 'grey',
          borderRadius: '5px',
          padding: '5px'
        }}>
          {mostRecentSentimentScore}
        </span>
      </div>
    </div>
  );
}

export default function Index() {
  //const [chartType, setChartType] = useState('all');
  const [data, setData] = useState(null);
  const initialData = useLoaderData();

  useEffect(() => {
    // Always setting daily data since that's the only data we're working with now
    console.log('Setting daily data');
    setData(initialData.dailyData);
    // No need for checking chartType since we're not toggling between data types anymore
    /*
    if (chartType === 'daily') {
      console.log('Setting daily data');
      setData(initialData.dailyData);
    } else if (chartType === 'all') {
      console.log('Setting all data');
      setData(initialData.allData);
    }
    // Add more else if conditions here for other chart types
    */
  }, [initialData]); // Removed chartType from dependency array

  return (
    <div className="chart-container flex justify-center">
      {/* Commenting out the toggle buttons as they are no longer needed
      <div className="fixed left-16 top-4 space-y-2">
        <button 
          onClick={() => setChartType('all')} 
          className={`px-4 py-2 rounded-l-lg ${chartType === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}
        >
          All
        </button>
        <button 
          onClick={() => setChartType('daily')} 
          className={`px-4 py-2 rounded-r-lg ${chartType === 'daily' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}
        >
          Daily
        </button>
      </div>
      */}
      <div className="mx-auto">
        {data && Object.entries(data).map(([title, data], index) => (
          <div key={index} className="p-4 my-4">
            <CustomChart key={title} title={title} data={data} />
          </div>
        ))}
      </div>
    </div>
  );
}