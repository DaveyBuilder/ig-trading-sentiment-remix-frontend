import type { MetaFunction, LoaderFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export let loader: LoaderFunction = async ({context}) => {
  let response = await fetch((context.env as {API_URL: string}).API_URL);
  let data = await response.json();
  return json(data);
};

export default function Index() {
  let data = useLoaderData();
  return (
    <pre>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}