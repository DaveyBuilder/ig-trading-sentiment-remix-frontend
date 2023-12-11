import type { MetaFunction, LoaderFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';

export const meta: MetaFunction = () => {
  return [
    { title: "Sentiment Charts" },
    { name: "description", content: "Charts displaying sentiment data & price from IG Trading" },
  ];
};

export let loader: LoaderFunction = async ({context}) => {
  let response = await fetch((context.env as {API_URL: string}).API_URL + '/allDataPoints');
  let data = await response.json();
  return json(data);
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
      unixTime: new Date(item.unixTime).toISOString().slice(0, 16).replace('T', ' '),
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

  return (
    <>
      <h2 className="text-center text-4xl">{title}</h2>
      <LineChart width={1000} height={500} data={chartData}>
        <Line type="monotone" dataKey="price" stroke="#8884d8" yAxisId="right" dot={false} />
        <Line type="monotone" dataKey="sentimentScoreIs50" stroke="grey" dot={false} strokeWidth={6} />
        <Line type="monotone" dataKey="sentimentScoreBelow50" stroke="red" dot={false} strokeWidth={6} />
        <Line type="monotone" dataKey="sentimentScoreAbove50" stroke="green" dot={false} strokeWidth={6} />
        <XAxis dataKey="unixTime" tick={false} />
        <YAxis domain={[0, 100]} tick={false} />
        <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} tick={false} />
        {/*<ReferenceLine y={50} stroke="black" strokeOpacity={0.5} />
        <ReferenceLine y={25} stroke="grey" strokeOpacity={0.2} />
        <ReferenceLine y={75} stroke="grey" strokeOpacity={0.2} />*/}
        <Tooltip content={CustomTooltip} isAnimationActive={false} />
      </LineChart>
    </>
  );
}

export default function Index() {
  const data = useLoaderData();

  return (
    <div className="chart-container flex justify-center">
      <div className="mx-auto">
        {Object.entries(data).map(([title, data], index) => (
          <div key={index} className="p-4"> {/* Add padding here */}
            <CustomChart key={title} title={title} data={data} />
          </div>
        ))}
      </div>
    </div>
  );
}